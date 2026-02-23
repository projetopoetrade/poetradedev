import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

export async function POST(req: NextRequest) {
    try {
        // Authenticate the request via CRON_SECRET or ADMIN_SECRET
        const authHeader = req.headers.get("authorization");
        const secret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;

        // Make authentication optional if secret is not set in dev, but enforce in prod.
        // Assuming CRON_SECRET is required.
        if (secret && authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createAdminClient();

        // 1. Fetch distinct items from price history
        // Since Supabase doesn't easily do SELECT DISTINCT across multiple columns without RPC or Views via the JS client,
        // we'll fetch a recent chunk or all unique items using a query. 
        // We'll just fetch all rows (it might be large, so ideally we fetch distinct via RPC. 
        // For now, let's fetch the recent 5000 records).
        console.log("[Sync-Ninja] Fetching recent price history...");
        const { data: historyData, error: historyError } = await supabase
            .from('currency_price_history')
            .select('item_name, item_category, game_version, league')
            .order('snapshot_at', { ascending: false })
            .limit(5000);

        if (historyError) throw historyError;

        if (!historyData || historyData.length === 0) {
            return NextResponse.json({ message: "No price history data available to sync." });
        }

        // De-duplicate items based on name and game_version
        const uniqueHistoryItems = new Map<string, any>();
        historyData.forEach((row) => {
            const key = `${row.item_name}-${row.game_version}`;
            if (!uniqueHistoryItems.has(key)) {
                uniqueHistoryItems.set(key, row);
            }
        });

        const ninjaItems = Array.from(uniqueHistoryItems.values());
        console.log(`[Sync-Ninja] Found ${ninjaItems.length} unique items in history.`);

        // 2. Fetch existing products and leagues
        const [
            { data: existingProducts, error: productsError },
            { data: leaguesList, error: leaguesError }
        ] = await Promise.all([
            supabase.from('products').select('name, gameVersion'),
            supabase.from('leagues').select('name, poe_ninja_name')
        ]);

        if (productsError) throw productsError;
        if (leaguesError) throw leaguesError;

        const existingSet = new Set(
            (existingProducts || []).map(p => `${p.name}-${p.gameVersion}`)
        );

        // Create a map to resolve ninja names to official supabase names
        const leagueNameResolver = new Map<string, string>();
        leaguesList?.forEach(l => {
            // Map both the exact name and the ninja name to the official name
            leagueNameResolver.set(l.name.toLowerCase(), l.name);
            if (l.poe_ninja_name) {
                leagueNameResolver.set(l.poe_ninja_name.toLowerCase(), l.name);
            }
        });

        // 3. Find missing items
        const newProductsToCreate: any[] = [];

        for (const item of ninjaItems) {
            // Translate the game_version string from Ninja crawler format to standard format
            const targetGameVersion = item.game_version === 'poe2' ? 'path-of-exile-2' : 'path-of-exile-1';
            const key = `${item.item_name}-${targetGameVersion}`;

            if (!existingSet.has(key)) {

                // Resolve the official league name (fallback to the given string if not mapped)
                const lookupLeague = item.league ? item.league.toLowerCase() : '';
                const officialLeagueName = leagueNameResolver.get(lookupLeague) || item.league;

                const productSlug = generateSlug(item.item_name);

                newProductsToCreate.push({
                    name: item.item_name,
                    slug: productSlug,
                    category: item.item_category,
                    gameVersion: targetGameVersion,
                    league: officialLeagueName,     // Using the mapped official Supabase league name
                    difficulty: 'softcore',  // Default
                    price: 0,                // Default starting price
                    is_listed: false,        // Important: keep unlisted
                    in_stock: false,
                    imgUrl: `/images/products/${productSlug}.png`, // Automatically map to local path
                });

                // Add to existingSet to avoid duplicates in this loop if ninjaItems had weird dupes
                existingSet.add(key);
            }
        }

        console.log(`[Sync-Ninja] Identifying ${newProductsToCreate.length} new products to create.`);

        // 4. Bulk insert into products
        if (newProductsToCreate.length > 0) {
            const { error: insertError } = await supabase
                .from('products')
                .insert(newProductsToCreate);

            if (insertError) {
                console.error("[Sync-Ninja] Error inserting sub-batch of products:", insertError);
                throw insertError;
            }

            console.log(`[Sync-Ninja] Successfully created ${newProductsToCreate.length} products!`);
        }

        return NextResponse.json({
            success: true,
            syncedItemsCount: newProductsToCreate.length,
            message: newProductsToCreate.length > 0
                ? `Successfully synced ${newProductsToCreate.length} products.`
                : "All items are already synced."
        });

    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
