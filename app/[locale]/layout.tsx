import HeaderAuth from "@/components/header-auth";
import { SiteNavbar } from "@/components/site-navbar";
import { GoogleTagManager } from "@next/third-parties/google";
import { Roboto, Source_Sans_3 } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { CurrencyProvider } from "@/lib/contexts/currency-context";
import { CartProvider } from "@/lib/contexts/cart-context";
import { Analytics } from "@vercel/analytics/react";
import ConsentedProviders from "@/components/consented-providers";
import "../globals.css";
import Footer from "@/components/footer";
import { setRequestLocale, getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import CookieConsent from "@/components/cookie-consent";
import type { Metadata } from "next";
import { buildCanonical, getHreflangAlternates, generateKeywords } from "@/lib/utils";
import { Toaster } from "sonner";
import { headers } from "next/headers";

function getPathWithoutLocale(path: string, locale: string) {
  if (path === `/${locale}` || path === `/${locale}/`) return '/';
  if (path.startsWith(`/${locale}/`)) return path.replace(`/${locale}`, '');
  return path;
}
// -----------------------------------------------------------------------------

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "SEO" });

  // 1. Tenta pegar o caminho real via headers (passado pelo Middleware)
  const headersList = await headers();
  // Se o header não existir, fallback para a lógica da home baseada no locale
  const rawPathname = headersList.get('x-pathname') || (locale === 'en' ? '/' : `/${locale}`);

  // 2. Constrói a Canonical Auto-referenciada (A CORREÇÃO PRINCIPAL)
  // A canonical deve ser EXATAMENTE a URL atual.
  // Se estou em /pt-br, canonical = /pt-br. Se estou em /pt-br/trade, canonical = /pt-br/trade
  const canonical = buildCanonical(rawPathname, locale);

  // 3. Prepara os Hreflangs dinâmicos
  // Precisamos saber qual é a "rota base" sem o locale para montar os links alternativos
  const pathWithoutLocale = getPathWithoutLocale(rawPathname, locale);

  // Define os prefixos corretos para cada língua
  const enPath = pathWithoutLocale === '/' ? '/' : pathWithoutLocale;
  const ptPath = pathWithoutLocale === '/' ? '/pt-br' : `/pt-br${pathWithoutLocale}`;

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

    // ---------------------------------------------------------
    // AQUI ESTÁ A CORREÇÃO DE SEO
    // ---------------------------------------------------------
    alternates: {
      // Canonical aponta para a página atual
      canonical: canonical,

      // Languages apontam para as versões equivalentes
      languages: {
        'en': buildCanonical(enPath, 'en'),
        'pt-BR': buildCanonical(ptPath, 'pt-br'),
        'x-default': buildCanonical(enPath, 'en'), // Fallback para inglês
      },
    },

    openGraph: {
      title: t("layout.ogTitle"),
      description: t("layout.ogDescription"),
      url: canonical,
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
  const headersList = await headers();
  // x-pathname is set by the middleware; next-url is a built-in Next.js header
  // that's always available as a reliable fallback.
  const pathname =
    headersList.get('x-pathname') ||
    headersList.get('next-url') ||
    '';

  const isAdminRoute =
    pathname.includes('/admin') || pathname.includes('/studio');

  setRequestLocale(locale);
  const messages = await getMessages();


  // If it's an admin route, render without header/footer
  if (isAdminRoute) {
    return (
      <html
        lang={locale}
        className={`${roboto.variable} ${sourceSans.variable} ${fontin.variable}`}
        suppressHydrationWarning
      >
        <body className="bg-gray-900 text-white" suppressHydrationWarning>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: '#1f2937',
                    color: '#ffffff',
                    border: '1px solid #374151',
                  },
                  className: 'border border-gray-600',
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

  return (
    <html
      lang={locale}
      className={`${roboto.variable} ${sourceSans.variable}`}
      suppressHydrationWarning
    >

      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>

            <CurrencyProvider>
              <CartProvider>
                <SiteNavbar locale={locale} desktopAuth={<HeaderAuth />} />

                <div className="pt-16">
                  {children}
                </div>
                <Footer locale={locale} />
                <Analytics />
                <ConsentedProviders />
                <CookieConsent locale={locale} />
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
              </CartProvider>
            </CurrencyProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
