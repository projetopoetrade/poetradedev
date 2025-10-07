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
import { buildCanonical, getHreflangAlternates } from "@/lib/utils";
import { Toaster } from "sonner";

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
    }
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

  setRequestLocale(locale);
  const messages = await getMessages();


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
              <nav className="w-full flex justify-center border-b border-b-foreground/10 h-18 fixed md:relative top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 md:bg-background md:backdrop-blur-none supports-[backdrop-filter]:bg-background/80">
                <div className="w-full max-w-6xl flex items-center text-sm">
                  <div className="flex-1">{/* Left empty space */}</div>
                  <div className="flex-1 flex justify-center">
                    <Link href="/" className="py-3 flex items-center">
                      <Image
                        src="/images/logo.webp"
                        alt="Path of Trade - Buy POE 1 & 2 Currency"
                        width={110}
                        height={55}
                        className="h-auto w-auto"
                        priority
                        fetchPriority="high"
                        quality={90}
                        sizes="(max-width: 768px) 110px, 110px"
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

              <div className="pt-[72px] md:pt-0 md:mt-8">
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
