import HeaderAuth from "@/components/header-auth";
import { GoogleTagManager } from "@next/third-parties/google";
import { Roboto, Source_Sans_3 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import Image from "next/image";
import { CurrencyProvider } from "@/lib/contexts/currency-context";
import { CartProvider } from "@/lib/contexts/cart-context";
import CartDropdown from "@/components/cart-dropdown";
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

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "SEO" });
  const title = t("layout.title");
  const description = t("layout.description");
  const ogTitle = t("layout.ogTitle");
  const ogDescription = t("layout.ogDescription");

  // Build canonical: for default locale (en), use root path; for others, use locale prefix
  const path = locale === 'en' ? '/' : `/${locale}`;
  const canonical = buildCanonical(path, locale);

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"),
    title,
    description,
    icons: {
      icon: [
        { url: "/images/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/images/favicon/favicon.svg", type: "image/svg+xml" }
      ],
      shortcut: "/images/favicon/favicon.ico",
      apple: "/images/favicon/apple-touch-icon.png"
    },
    appleWebApp: {
      title: "Path of Trade"
    },
    manifest: "/images/favicon/site.webmanifest",
    alternates: {
      canonical,
      ...getHreflangAlternates({
        "en": "/", // default locale without prefix
        "pt-br": "/pt-br"
      }, "/") // x-default points to root
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: "website",
      siteName: t("siteName"),
      images: [{ url: "/images/logo.webp" }]
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: ["/images/logo.webp"]
    },
    keywords: generateKeywords({
      locale,
      customKeywords: ['homepage', 'main page', 'poe trading site']
    })
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


export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}>) {
  const {locale} = await params;
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Check if this is an admin route
  const isAdminRoute = pathname.includes('/admin');

  setRequestLocale(locale);
  const messages = await getMessages();


  // If it's an admin route, render without header/footer
  if (isAdminRoute) {
    return (
      <html
        lang={locale}
        className={`${roboto.variable} ${sourceSans.variable}`}
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
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-20 fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/40 supports-[backdrop-filter]:bg-background/40 ">
                <div className="w-full max-w-6xl flex items-center text-sm">
                  <div className="flex-1">{/* Left empty space */}</div>
                  <div className="flex-1 flex justify-center ">
                    <Link href="/" className="py-2 flex items-center">
                      <Image
                        src="/images/logo.webp"
                        alt="Path of Trade - Buy POE 1 & 2 Currency"
                        width={100}
                        height={100}
                        priority
                        fetchPriority="high"
                        quality={90}
                        sizes="(max-width: 768px) 100px, 100px"
                      />
                    </Link>
                  </div>
                  <div className="flex-[1.2] flex justify-end items-center gap-3">
                    <CartDropdown />
                    <div className="hidden md:flex items-center gap-3">
                      <HeaderAuth />
                    </div>
                    <div className="md:hidden flex items-center">
                      <HeaderAuth />
                    </div>
                  </div>
                </div>
              </nav>

              <div className="pt-[68px]">
                {children}
              </div>
              <Footer />
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
