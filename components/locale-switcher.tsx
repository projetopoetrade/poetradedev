'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useParams, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'EN', hrefLang: 'en', switchLabel: 'Switch to English' },
  { code: 'pt-br', label: 'BR', hrefLang: 'pt-BR', switchLabel: 'Mudar para Português' },
] as const;

/**
 * Locale switcher rendered as real, always-present <a> links (not a JS
 * dropdown). This keeps the EN <-> pt-br bridge crawlable on every page, so
 * search engines can discover and flow PageRank into the pt-br tree instead
 * of leaving it orphaned. The link for the active locale is rendered as plain
 * text; the other locale(s) point at the current path in that locale.
 */
export default function LocaleSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'en';
  const query = Object.fromEntries(searchParams.entries());

  return (
    <div className="flex items-center gap-1 text-xs" aria-label="Language">
      <Globe className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
      {LOCALES.map((l, i) => (
        <span key={l.code} className="flex items-center">
          {i > 0 && <span className="mx-1 opacity-40" aria-hidden="true">|</span>}
          {l.code === currentLocale ? (
            <span className="font-semibold" aria-current="true">
              {l.label}
            </span>
          ) : (
            <Link
              href={{ pathname, query }}
              locale={l.code}
              hrefLang={l.hrefLang}
              aria-label={l.switchLabel}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
