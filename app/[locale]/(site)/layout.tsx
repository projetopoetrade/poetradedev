import HeaderAuth from "@/components/header-auth";
import { SiteNavbar } from "@/components/site-navbar";
import { CurrencyProvider } from "@/lib/contexts/currency-context";
import { CartProvider } from "@/lib/contexts/cart-context";
import { Analytics } from "@vercel/analytics/react";
import ConsentedProviders from "@/components/consented-providers";
import Footer from "@/components/footer";
import CookieConsent from "@/components/cookie-consent";
import { setRequestLocale } from "next-intl/server";

// Chrome do site público. Separado do layout raiz para que o admin não o herde
// — antes a distinção era feita lendo `x-pathname` via headers() no root, o que
// tornava todas as rotas dinâmicas.
//
// Nada aqui pode chamar API dinâmica (headers/cookies). `HeaderAuth` é Client
// Component justamente por isso: estado de login é por usuário e não pertence
// ao HTML estático.
export default async function SiteLayout(
  props: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }>
) {
  const { children, params } = props;
  const { locale } = await params;

  setRequestLocale(locale);

  return (
    <CurrencyProvider>
      <CartProvider>
        <SiteNavbar locale={locale} desktopAuth={<HeaderAuth />} />

        <div className="pt-16">{children}</div>

        <Footer locale={locale} />
        <Analytics />
        <ConsentedProviders />
        <CookieConsent locale={locale} />
      </CartProvider>
    </CurrencyProvider>
  );
}
