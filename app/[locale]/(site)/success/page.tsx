"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Package, Receipt, ShoppingBag, Calendar, ArrowRight, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCart } from "@/lib/contexts/cart-context";

interface SessionData {
  status: string;
  customer_email: string;
  amount_total: number;
  payment_status?: string;
  shipping_details?: any;
  metadata: {
    orderId?: string;
    characterName?: string;
  };
  created?: number;
  currency?: string;
}

const formatCurrency = (amount: number, currency = 'usd') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100);
};

const formatDate = (timestamp: number) => {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

function SuccessContent() {
  const t = useTranslations('Success');
  const footerT = useTranslations('Footer');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();

  useEffect(() => {
    async function verifySession() {
      if (!sessionId) {
        setStatus('error');
        return;
      }

      try {
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify session');
        }

        setSessionData(data);
        setStatus('success');
        
        // Limpar o carrinho após confirmar a ordem
        clearCart();
      } catch (error) {
        console.error('Error verifying session:', error);
        setStatus('error');
      }
    }

    verifySession();
  }, [sessionId, clearCart]);

  if (status === 'loading') {
    return (
      <div className="animate-in flex-1 flex flex-col gap-6 max-w-4xl px-3 items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <h1 className="text-3xl font-bold">{t('processing')}</h1>
          <p className="text-muted-foreground">{t('processingDescription')}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="animate-in flex-1 flex flex-col gap-6 max-w-4xl px-3 items-center ">
        <Card className="p-8 text-center border-red-200 bg-red-50 dark:bg-red-950/30 max-w-xl w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/50">
              <AlertCircle className="text-red-500 h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-red-700 dark:text-red-400">{t('somethingWrong')}</h1>
            <p className="text-muted-foreground max-w-md">
              {t('errorDescription')}
            </p>
            <div className="flex gap-4 mt-4">
              <Button asChild variant="outline">
                <Link href="/support/tickets">{t('contactSupport')}</Link>
              </Button>
              <Button asChild>
                <Link href="/cart">{t('returnToCart')}</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col gap-3 max-w-5xl px-3 py-3 min-h-[calc(100vh-8rem)]">
      <Card className="p-5 shadow-md border-green-100 bg-gradient-to-b from-white to-green-50/50 dark:from-gray-950 dark:to-green-950/10">
        <div className="flex flex-col items-center gap-2.5 text-center">
          <div className="animate-in zoom-in duration-500 delay-300 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="animate-in fade-in duration-500 delay-500 text-2xl font-bold">
            {t('orderConfirmed')}
          </h1>
          <p className="animate-in fade-in duration-500 delay-700 text-sm text-muted-foreground max-w-lg">
            {t('thankYou')}{" "}
            <span className="font-medium">{sessionData?.customer_email}</span>{" "}
            {t('withDetails')}
          </p>
        </div>
      </Card>

      {sessionData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="p-5 col-span-1 md:col-span-2 animate-in fade-in duration-500 delay-200">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4" />
                {t('orderSummary')}
              </h2>
              <div className="space-y-2.5">
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">{t('orderId')}</span>
                  <span className="font-medium">{sessionData.metadata?.orderId}</span>
                </div>
                {sessionData.metadata?.characterName && (
                  <div className="flex justify-between border-b pb-2 text-sm">
                    <span className="text-muted-foreground">{t('characterName')}</span>
                    <span className="font-medium">{sessionData.metadata.characterName}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">{t('orderDate')}</span>
                  <span className="font-medium">{formatDate(sessionData.created || 0)}</span>
                </div>
                <div className="flex justify-between border-b pb-2 text-sm">
                  <span className="text-muted-foreground">{t('paymentStatus')}</span>
                  <span className="font-medium capitalize text-sm">
                    <span className={`inline-block rounded-full w-2 h-2 mr-1.5 ${
                      sessionData.payment_status === 'succeeded' || sessionData.payment_status === 'paid' ? 'bg-green-500' : 
                      sessionData.payment_status === 'processing' ? 'bg-blue-500' : 
                      'bg-amber-500'
                    }`}></span>
                    {sessionData.payment_status === 'succeeded' || sessionData.payment_status === 'paid' 
                      ? t('succeeded') 
                      : sessionData.payment_status === 'processing' 
                      ? t('paymentProcessing') 
                      : sessionData.payment_status || sessionData.status}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>{t('total')}</span>
                  <span>{formatCurrency(sessionData.amount_total, sessionData.currency)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5 animate-in fade-in duration-500 delay-400">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-3">
                <Package className="h-4 w-4" />
                {t('whatsNext')}
              </h2>
              <ul className="space-y-3">
                <li className="flex gap-2.5">
                  <span className="flex-shrink-0 bg-primary/10 p-1.5 rounded-full h-7 w-7 flex items-center justify-center text-primary font-semibold text-sm">1</span>
                  <div>
                    <p className="font-medium text-sm">{t('step1Title')}</p>
                    <p className="text-xs text-muted-foreground">{t('step1Description')}</p>
                  </div>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex-shrink-0 bg-primary/10 p-1.5 rounded-full h-7 w-7 flex items-center justify-center text-primary font-semibold text-sm">2</span>
                  <div>
                    <p className="font-medium text-sm">{t('step2Title')}</p>
                    <p className="text-xs text-muted-foreground">{t('step2Description')}</p>
                  </div>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex-shrink-0 bg-primary/10 p-1.5 rounded-full h-7 w-7 flex items-center justify-center text-primary font-semibold text-sm">3</span>
                  <div>
                    <p className="font-medium text-sm">{t('step3Title')}</p>
                    <p className="text-xs text-muted-foreground">{t('step3Description')}</p>
                  </div>
                </li>
              </ul>
            </Card>
          </div>

          {sessionData.metadata?.characterName && (
            <Card className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 animate-in fade-in duration-500 delay-600">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100">{t('importantInfo')}</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {t('deliveryNote')} <span className="font-semibold">{sessionData.metadata.characterName}</span> {t('isOnline')} <span className="font-semibold">Path of Exile</span> {t('toReceive')}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium hover:underline">
                    <Link href="/support/tickets">{t('needHelp')}</Link>
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Trustpilot CTA */}
      <Card className="p-6 border-dashed border-gray-300 dark:border-gray-700 bg-transparent animate-in fade-in duration-500 delay-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-lg font-bold mb-1">{t('leaveReview')}</h3>
            <div className="flex gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-[#00b67a] p-1 rounded-sm">
                  <Star size={16} fill="white" stroke="white" />
                </div>
              ))}
            </div>
          </div>
          <Button asChild className="bg-[#00b67a] hover:bg-[#00a06b] text-white border-none px-8 h-12 text-base font-bold shrink-0">
            <a href={footerT('trustpilot-url')} target="_blank" rel="noopener noreferrer">
              {t('reviewButton')}
            </a>
          </Button>
        </div>
      </Card>

      <div className="flex gap-3 justify-center animate-in fade-in duration-500 delay-800">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <ShoppingBag className="h-4 w-4" />
            {t('continueShopping')}
          </Link>
        </Button>
        <Button asChild className="gap-2">
          <Link href="/orders">
            <Calendar className="h-4 w-4" />
            {t('viewOrders')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function LoadingFallback() {
  const t = useTranslations('Success');
  
  return (
    <div className="animate-in flex-1 flex flex-col gap-6 max-w-4xl px-3 items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <h1 className="text-3xl font-bold">{t('loading')}</h1>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="flex-1 w-full flex flex-col items-center">
      <Suspense fallback={<LoadingFallback />}>
        <SuccessContent />
      </Suspense>
    </main>
  );
} 
 