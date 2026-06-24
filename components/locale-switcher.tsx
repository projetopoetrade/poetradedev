'use client';

import Link from 'next/link';
import { usePathname } from '@/i18n/navigation';
import { useParams, useSearchParams } from 'next/navigation';
import { Globe } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'EN', hrefLang: 'en', switchLabel: 'Switch to English' },
  { code: 'pt-br', label: 'BR', hrefLang: 'pt-BR', switchLabel: 'Mudar para Português' },
] as const;

/**
 * Locale switcher rendered as real, always-present <a> links (not a JS
 * dropdown), so the EN <-> pt-br bridge stays crawlable on every page and
 * PageRank flows into the pt-br tree.
 *
 * The href is built manually (default locale `en` => no prefix, `pt-br` =>
 * `/pt-br` prefix) instead of using next-intl's `locale` prop, which with
 * `localePrefix: 'as-needed'` wrongly emits `/en/...` for the default locale
 * and creates duplicate (redirecting) URLs.
 */
export default function LocaleSwitcher() {
  const pathname = usePathname(); // already stripped of the locale prefix
  const searchParams = useSearchParams();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'en';

  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : '';

  const hrefFor = (code: string) => {
    if (code === 'en') return `${pathname || '/'}${suffix}`;
    const path = pathname === '/' ? '' : pathname;
    return `/pt-br${path}${suffix}`;
  };

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
              href={hrefFor(l.code)}
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
