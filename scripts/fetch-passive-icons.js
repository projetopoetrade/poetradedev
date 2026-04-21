/**
 * Bulk-downloads every PoE passive skill icon from the wiki, converts each
 * PNG to WebP via sharp (quality: 80, effort: 6), and emits:
 *
 *   public/images/passives/<slug>.webp         - one file per unique icon
 *   public/images/passives/manifest.json       - { "Node Name": "<slug>.webp", ... }
 *
 * When to run:
 *   - After a GGG patch bump (new keystones/notables occasionally ship new art).
 *   - Never, if the wiki hasn't updated art since the last run - the engine
 *     service falls back to Special:Filepath URLs when the manifest is stale
 *     or missing, so bootstrap still works.
 *
 * Where files go:
 *   public/images/passives/
 *     manifest.json                       Vercel CDN-cacheable node->file map.
 *     <slug>.webp                         One WebP per unique upstream PNG;
 *                                         many nodes (+30 Int etc.) share art,
 *                                         so the set is deduplicated by slug.
 *
 * How the manifest is consumed:
 *   packages/api/src/modules/knowledge/tree-ingest.service.ts loads it from
 *   ${PASSIVE_ICON_BASE_URL}/manifest.json (defaults to the pathoftrade.net
 *   origin, cached 10 min in-process) during ingest, so PassiveSkill.iconUrl
 *   points at the Vercel CDN instead of triggering wiki 302/301 redirects on
 *   every first paint of a {{passive:...}} tooltip.
 *
 * Size expectations:
 *   ~500-1000 unique icons totalling ~20-40MB on disk. Commit to git -
 *   Vercel's static file serving is what we're paying for here.
 *
 * Usage:
 *   node scripts/fetch-passive-icons.js            # incremental (skips existing)
 *   node scripts/fetch-passive-icons.js --force    # re-download everything
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WIKI_CARGO_URL = 'https://www.poewiki.net/w/api.php';
const WIKI_FILEPATH_URL = 'https://www.poewiki.net/wiki/Special:Filepath';
// UA the wiki's fastly in front of them likes - generic `node-fetch` UAs
// sometimes get 403'd. Mirror what the engine uses so behaviour is consistent.
const USER_AGENT = 'PathOfTrade-IconScript/1.0 (+https://pathoftrade.net)';

const PAGE_SIZE = 500;
const WIKI_PAGE_DELAY_MS = 1000; // 1s between Cargo pages (wiki etiquette)
const CONCURRENT_DOWNLOADS = 8; // in-flight icon fetches. With direct CDN URLs (resolved via imageinfo API batch) the images CDN is generous; Special:Filepath was the slow gate, not the CDN itself.
const PER_WORKER_PAUSE_MS = 50; // each worker sleeps this long after a successful download before pulling the next job.
const MAX_WIKI_PAGES = 30; // safety cap - ~5.5k nodes / 500 per page ~= 11
const MAX_CARGO_RETRIES = 4; // per-page retry budget - wiki 5xx-flaps should not abort the whole run
const CARGO_BACKOFF_BASE_MS = 2000; // 2s, 4s, 8s, 16s

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images', 'passives');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');

const FORCE = process.argv.includes('--force');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Derive a stable, filesystem-safe slug from a wiki File: reference.
 *
 * Examples:
 *   "File:KeystoneChaosInoculation passive skill icon.png" -> "keystone-chaos-inoculation"
 *   "File:Plusintelligence.png"                             -> "plusintelligence"
 *   "File:PolymathTrickster (Trickster) passive skill icon.png"
 *     -> "polymath-trickster-trickster"
 *
 * The slug is stable per wiki filename so dedup works across invocations.
 */
function slugifyIconFilename(iconField) {
    if (!iconField) return null;
    let s = String(iconField).trim();
    // Strip "File:" namespace prefix (case-insensitive).
    s = s.replace(/^File:/i, '').trim();
    if (!s) return null;
    // Strip extension.
    s = s.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
    // Strip trailing " passive skill icon" (the wiki's standard naming).
    s = s.replace(/\s*passive skill icon\s*$/i, '');
    // Split CamelCase -> camel-case (insert hyphen between lower-upper transitions).
    s = s.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
    // Collapse non-alphanumeric runs to single hyphens.
    s = s.replace(/[^a-zA-Z0-9]+/g, '-');
    // Trim hyphens + lowercase.
    s = s.replace(/^-+|-+$/g, '').toLowerCase();
    return s || null;
}

/**
 * Strip wiki "File:" prefix to get a bare filename usable for Special:Filepath.
 */
function stripFilePrefix(iconField) {
    return String(iconField || '').replace(/^File:/i, '').trim();
}

/**
 * Fetch + parse a single Cargo page with retry/backoff. The wiki occasionally
 * returns 500/503 mid-pagination; we retry with exponential backoff instead
 * of aborting 7k rows deep.
 */
async function fetchCargoPage(offset, attempt = 0) {
    const params = new URLSearchParams({
        action: 'cargoquery',
        tables: 'passive_skills',
        fields: 'name,icon',
        limit: String(PAGE_SIZE),
        offset: String(offset),
        format: 'json',
    });
    const url = `${WIKI_CARGO_URL}?${params}`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        });
        if (res.ok) return await res.json();
        if (res.status >= 500 && attempt < MAX_CARGO_RETRIES) {
            const wait = CARGO_BACKOFF_BASE_MS * Math.pow(2, attempt);
            console.warn(`  cargo page offset=${offset} returned ${res.status}; retrying in ${wait}ms`);
            await sleep(wait);
            return fetchCargoPage(offset, attempt + 1);
        }
        throw new Error(`wiki cargo offset=${offset} failed: ${res.status} ${res.statusText}`);
    } catch (err) {
        if (attempt < MAX_CARGO_RETRIES) {
            const wait = CARGO_BACKOFF_BASE_MS * Math.pow(2, attempt);
            console.warn(`  cargo page offset=${offset} error (${err.message}); retrying in ${wait}ms`);
            await sleep(wait);
            return fetchCargoPage(offset, attempt + 1);
        }
        throw err;
    }
}

/**
 * Paginate wiki Cargo passive_skills table. Returns every {name, icon} pair
 * where icon is non-empty, in the order the wiki returns them (which tends
 * to be canonical nodes first, then ascendancy variants).
 */
async function fetchAllPassiveIcons() {
    const rows = [];
    let offset = 0;
    for (let page = 0; page < MAX_WIKI_PAGES; page++) {
        const payload = await fetchCargoPage(offset);
        const batch = payload.cargoquery || [];
        if (batch.length === 0) break;

        for (const row of batch) {
            const name = row.title && typeof row.title.name === 'string' ? row.title.name.trim() : '';
            const icon = row.title && typeof row.title.icon === 'string' ? row.title.icon.trim() : '';
            if (!name || !icon) continue;
            rows.push({ name, icon });
        }

        process.stdout.write(`  cargo page ${page + 1}: ${batch.length} rows (cumulative ${rows.length})\n`);
        if (batch.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
        await sleep(WIKI_PAGE_DELAY_MS);
    }
    return rows;
}

/**
 * Batch-resolve direct CDN image URLs via the MediaWiki `query+imageinfo` API.
 * Accepts up to 50 "File:X" titles per call, returns a Map filename -> direct
 * URL. This endpoint uses a different rate-limit bucket than Special:Filepath
 * (which gets throttled hard after ~500 hits) so it stays fast for the full
 * 1600+ icon list.
 */
async function resolveDirectUrls(filenames) {
    const result = new Map();
    if (filenames.length === 0) return result;

    const titles = filenames.map((f) => `File:${f}`).join('|');
    const params = new URLSearchParams({
        action: 'query',
        prop: 'imageinfo',
        iiprop: 'url',
        titles,
        format: 'json',
    });
    const url = `${WIKI_CARGO_URL}?${params}`;

    for (let attempt = 0; attempt <= 3; attempt++) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
            });
            if (res.ok) {
                const payload = await res.json();
                const pages = payload.query && payload.query.pages;
                if (!pages) return result;
                for (const pageId of Object.keys(pages)) {
                    const page = pages[pageId];
                    const title = page.title || '';
                    const filename = title.replace(/^File:/i, '');
                    const info = page.imageinfo && page.imageinfo[0];
                    if (info && info.url) {
                        result.set(filename, info.url);
                    }
                }
                return result;
            }
            if (res.status >= 500 && attempt < 3) {
                await sleep(1000 * Math.pow(2, attempt));
                continue;
            }
            return result;
        } catch (err) {
            if (attempt < 3) await sleep(1000 * Math.pow(2, attempt));
        }
    }
    return result;
}

/**
 * Download one PNG from a pre-resolved direct URL and convert it to WebP
 * on disk. Returns {ok: true, skipped?: bool} on success, {ok: false, reason}
 * on permanent failure. Retries transient 5xx / network errors up to 3x.
 */
async function downloadAndConvert(iconField, slug, directUrl) {
    const outPath = path.join(OUTPUT_DIR, `${slug}.webp`);

    if (!FORCE) {
        try {
            await fs.access(outPath);
            return { ok: true, skipped: true };
        } catch {
            // does not exist, fall through to download
        }
    }

    // Fallback to Special:Filepath redirect chain when the batch resolver
    // didn't return a direct URL (title mismatch, missing file, etc).
    const url = directUrl || `${WIKI_FILEPATH_URL}/${encodeURIComponent(stripFilePrefix(iconField))}`;

    let buf = null;
    let lastReason = 'unknown';
    for (let attempt = 0; attempt <= 3; attempt++) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': USER_AGENT, Accept: 'image/png,image/*' },
                redirect: 'follow',
            });
            if (res.ok) {
                const b = Buffer.from(await res.arrayBuffer());
                if (b.length === 0) {
                    lastReason = 'empty response';
                    // transient? retry once
                } else {
                    buf = b;
                    break;
                }
            } else if (res.status === 404) {
                return { ok: false, reason: 'HTTP 404' };
            } else {
                lastReason = `HTTP ${res.status}`;
            }
        } catch (err) {
            lastReason = `net: ${err.message}`;
        }
        if (attempt < 3) await sleep(500 * Math.pow(2, attempt));
    }
    if (!buf) return { ok: false, reason: lastReason };

    try {
        await sharp(buf)
            .webp({ quality: 80, effort: 6 })
            .toFile(outPath);
    } catch (err) {
        return { ok: false, reason: `sharp: ${err.message}` };
    }
    return { ok: true, skipped: false };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Writes the manifest to disk, sorted by name. Safe to call repeatedly; used
 * both as the periodic checkpoint inside the worker pool and as the final
 * write. `manifest` is captured via closure by callers.
 */
async function persistManifest(manifest) {
    const sorted = Object.keys(manifest)
        .sort((a, b) => a.localeCompare(b))
        .reduce((acc, k) => {
            acc[k] = manifest[k];
            return acc;
        }, {});
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
    return sorted;
}

async function main() {
    console.log(`[passives] output dir: ${OUTPUT_DIR}`);
    console.log(`[passives] mode: ${FORCE ? 'FORCE (redownload all)' : 'incremental (skip existing)'}`);
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    console.log('[passives] fetching wiki Cargo passive_skills...');
    const rows = await fetchAllPassiveIcons();
    console.log(`[passives] wiki returned ${rows.length} {name, icon} pairs`);

    // Load existing manifest if it's there (merge with incremental run).
    /** @type {Record<string, string>} */
    let manifest = {};
    if (!FORCE) {
        try {
            const raw = await fs.readFile(MANIFEST_PATH, 'utf8');
            manifest = JSON.parse(raw);
            console.log(`[passives] loaded existing manifest with ${Object.keys(manifest).length} entries`);
        } catch {
            // no manifest yet, start fresh
        }
    }

    const processedSlugs = new Set();
    const failures = [];
    let downloaded = 0;
    let skippedExisting = 0;
    let mappedOnly = 0;

    // First pass: populate manifest + build unique download queue. Manifest
    // covers every row (even dedup hits); queue only has unique slugs we
    // haven't processed yet.
    /** @type {Array<{ name: string, icon: string, slug: string }>} */
    const downloadQueue = [];
    const queuedSlugs = new Set();
    for (const { name, icon } of rows) {
        const slug = slugifyIconFilename(icon);
        if (!slug) {
            failures.push({ name, icon, reason: 'unslugifiable' });
            continue;
        }
        manifest[name] = `${slug}.webp`;
        if (queuedSlugs.has(slug)) {
            mappedOnly++;
            continue;
        }
        queuedSlugs.add(slug);
        downloadQueue.push({ name, icon, slug });
    }

    console.log(
        `[passives] ${rows.length} rows mapped -> ${downloadQueue.length} unique icons to fetch ` +
        `(${mappedOnly} dedup'd)`,
    );

    // Install signal handlers: if the script is killed (SIGINT / SIGTERM /
    // hard timeout from a wrapper), flush the current manifest so partial
    // progress isn't thrown away. The manifest always reflects the union of
    // the CURRENT run's observations and anything already on disk; partial
    // runs simply leave fewer icons but still produce a valid mapping.
    const flushAndExit = async (code) => {
        try { await persistManifest(manifest); } catch {}
        process.exit(code);
    };
    process.on('SIGINT', () => flushAndExit(130));
    process.on('SIGTERM', () => flushAndExit(143));

    // Pre-resolve direct CDN URLs in batches of 50 via MediaWiki's
    // imageinfo API. This is a different rate-limit bucket than
    // Special:Filepath (which throttles hard after ~500 hits) and lets us
    // skip the 2-3 redirect chain per image. Only resolves icons whose
    // WebP isn't already on disk — cached hits don't need the URL.
    /** @type {Map<string, string>} */
    const directUrls = new Map();
    const toResolve = [];
    for (const job of downloadQueue) {
        const outPath = path.join(OUTPUT_DIR, `${job.slug}.webp`);
        try {
            await fs.access(outPath);
            // already exists — don't bother resolving
        } catch {
            toResolve.push(stripFilePrefix(job.icon));
        }
    }
    if (toResolve.length > 0) {
        console.log(`[passives] resolving ${toResolve.length} direct CDN URLs via imageinfo API (batches of 50)...`);
        const BATCH = 50;
        for (let i = 0; i < toResolve.length; i += BATCH) {
            const batch = toResolve.slice(i, i + BATCH);
            const resolved = await resolveDirectUrls(batch);
            for (const [filename, url] of resolved) {
                directUrls.set(filename, url);
            }
            if (i % 200 === 0 || i + BATCH >= toResolve.length) {
                console.log(`  resolved ${Math.min(i + BATCH, toResolve.length)}/${toResolve.length} (${directUrls.size} URLs mapped)`);
            }
            // 200ms between batches keeps the API calmly responsive
            await sleep(200);
        }
    }

    // Second pass: parallel workers. Each worker loops pulling the next job
    // off a shared index cursor. This gives us bounded concurrency without a
    // library dependency and drops wall time from linear (~19s * uniques)
    // to roughly (work / CONCURRENT_DOWNLOADS).
    let cursor = 0;
    const total = downloadQueue.length;
    let reportedMilestone = 0;
    let lastFlushedCompleted = 0;
    const FLUSH_EVERY = 100;

    async function worker(id) {
        for (;;) {
            const i = cursor++;
            if (i >= total) return;
            const job = downloadQueue[i];
            const directUrl = directUrls.get(stripFilePrefix(job.icon));
            const result = await downloadAndConvert(job.icon, job.slug, directUrl);
            if (result.ok) {
                processedSlugs.add(job.slug);
                if (result.skipped) skippedExisting++;
                else downloaded++;
            } else {
                failures.push({ name: job.name, icon: job.icon, slug: job.slug, reason: result.reason });
            }

            const completed = downloaded + skippedExisting;
            // Progress every 50 unique icons processed; lets us see the
            // script is alive without spamming.
            if (completed - reportedMilestone >= 50) {
                reportedMilestone = completed - (completed % 50);
                const pct = ((completed / total) * 100).toFixed(1);
                console.log(
                    `  progress: ${completed}/${total} unique icons (${pct}%) - ` +
                    `${downloaded} new / ${skippedExisting} cached / ${failures.length} failed`,
                );
            }
            // Checkpoint manifest every FLUSH_EVERY new downloads so a killed
            // run still leaves the mapping for everything completed so far.
            if (completed - lastFlushedCompleted >= FLUSH_EVERY) {
                lastFlushedCompleted = completed;
                try { await persistManifest(manifest); } catch {}
            }
            // Per-worker pause on real downloads only (cached hits are already free).
            if (result.ok && !result.skipped) await sleep(PER_WORKER_PAUSE_MS);
        }
    }

    await Promise.all(
        Array.from({ length: CONCURRENT_DOWNLOADS }, (_, id) => worker(id)),
    );

    // Final manifest write (pretty-printed, alphabetised by name for diff friendliness).
    const sortedManifest = await persistManifest(manifest);

    console.log('');
    console.log('[passives] done');
    console.log(`  unique icons: ${processedSlugs.size}`);
    console.log(`  downloaded new: ${downloaded}`);
    console.log(`  skipped existing: ${skippedExisting}`);
    console.log(`  additional name->slug mappings (shared icons): ${mappedOnly}`);
    console.log(`  manifest entries: ${Object.keys(sortedManifest).length}`);
    console.log(`  failures: ${failures.length}`);

    if (failures.length) {
        console.log('');
        console.log('[passives] failure details:');
        for (const f of failures.slice(0, 50)) {
            console.log(`  - ${f.name} (${f.icon}): ${f.reason}`);
        }
        if (failures.length > 50) {
            console.log(`  ... and ${failures.length - 50} more`);
        }
    }
}

main().catch((err) => {
    console.error('[passives] FATAL:', err);
    process.exit(1);
});

// Exported only for unit tests if anyone wants to reach in - not a stable API.
module.exports = { slugifyIconFilename, stripFilePrefix };
