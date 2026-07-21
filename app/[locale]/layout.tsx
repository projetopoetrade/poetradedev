import { Roboto, Source_Sans_3 } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "../globals.css";
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import type { Metadata } from "next";
import { generateKeywords } from "@/lib/utils";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";

// Sem isto o segmento [locale] não tem params conhecidos em build e TUDO abaixo
// dele permanece dinâmico — mesmo com `revalidate` declarado nas páginas.
// É requisito do next-intl para renderização estática.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// NOTE: este layout NÃO pode chamar `headers()`, `cookies()` nem qualquer API
// dinâmica. Como é o layout raiz, qualquer uso aqui opta TODAS as rotas do site
// para renderização dinâmica e neutraliza os ~30 `export const revalidate`
// espalhados pelas páginas — foi exatamente o que estourou o Fluid Active CPU
// da Vercel em jul/2026. Metadata por-rota (canonical/hreflang) vive no
// `generateMetadata` de cada página, que conhece o próprio path sem headers.

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"),
    title: t("layout.title"),
    description: t("layout.description"),

    // Configurações de Ícones
    icons: {
      icon: [
        { url: "/images/favicon/favicon-96x96.webp", sizes: "96x96", type: "image/webp" },
        { url: "/images/favicon/favicon.svg", type: "image/svg+xml" }
      ],
      shortcut: "/images/favicon/favicon.ico",
      apple: "/images/favicon/apple-touch-icon.webp"
    },
    appleWebApp: {
      title: "Path of Trade"
    },
    manifest: "/images/favicon/site.webmanifest",

    // `alternates` (canonical + hreflang) é responsabilidade de cada página:
    // 25 das 57 páginas já definem o seu, incluindo a home e todas as rotas
    // indexáveis. Defini-lo aqui exigiria saber o path via headers(), que é o
    // que tornava o site inteiro dinâmico.

    openGraph: {
      title: t("layout.ogTitle"),
      description: t("layout.ogDescription"),
      type: "website",
      locale: locale === "pt-br" ? "pt_BR" : "en_US",
      alternateLocale: locale === "pt-br" ? ["en_US"] : ["pt_BR"],
      siteName: t("siteName"),
      images: [{ url: "/images/logo.webp" }]
    },
    twitter: {
      card: "summary_large_image",
      title: t("layout.ogTitle"),
      description: t("layout.ogDescription"),
      images: ["/images/logo.webp"]
    },
    keywords: generateKeywords({
      locale,
      customKeywords: ['homepage', 'main page', 'poe trading site']
    }),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
  display: "swap",
  preload: true,
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-source-sans",
  display: "swap",
  preload: true,
});

// Self-hosted Fontin-SmallCaps — exact font the PoE in-game tooltip uses.
// Sourced from cdnfonts.com's Fontin family (complete glyph set with lowercase
// small-caps substitutions). An earlier TTF from horadric-helper only had
// ~41 glyphs (uppercase + digits + punctuation), causing lowercase letters
// in mod lines to fall back to Roboto. The WOFF file below is the full font.
const fontin = localFont({
  src: "../fonts/Fontin-SmallCaps.woff",
  variable: "--font-fontin",
  display: "swap",
  weight: "400",
  style: "normal",
});


export default async function RootLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }>
) {
  const { children, params } = props;
  const { locale } = await params;

  setRequestLocale(locale);
  const messages = await getMessages();

  // Shell mínimo e compartilhado. O chrome público (navbar, footer, providers
  // de carrinho/moeda) vive em `(site)/layout.tsx`; o admin traz o seu em
  // `admin/layout.tsx`. Antes isso era um `if (isAdminRoute)` decidido por
  // `headers()`, o que custava a renderização estática do site inteiro.
  return (
    <html
      lang={locale}
      // `fontin.variable` precisa estar aqui: a `.font-fontin` depende dela e
      // um var() não resolvido invalida a declaração inteira de font-family
      // (herda Roboto em vez de cair pra próxima família da lista). Era o que
      // fazia os tooltips do PoB viewer renderizarem em Roboto.
      className={`${roboto.variable} ${sourceSans.variable} ${fontin.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground" suppressHydrationWarning>
        {/* Dark-only site. The chrome is built dark-first — the header is
            transparent and the footer sits on black/40 — so a light theme turns
            both grey over a white body. `forcedTheme` pins dark and ignores the
            OS preference and any stored choice, so every route renders the way
            it was designed. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
                className: 'border border-border',
                duration: 3000,
              }}
              richColors
            />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
