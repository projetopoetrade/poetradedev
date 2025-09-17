"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, Package, Receipt, ShoppingBag, Calendar, ArrowRight } from "lucide-react";

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
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

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
      } catch (error) {
        console.error('Error verifying session:', error);
        setStatus('error');
      }
    }

    verifySession();
  }, [sessionId]);

  if (status === 'loading') {
    return (
      <div className="animate-in flex-1 flex flex-col gap-6 max-w-4xl px-3 items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <h1 className="text-3xl font-bold">Processing your order...</h1>
          <p className="text-muted-foreground">This will just take a moment.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="animate-in flex-1 flex flex-col gap-6 max-w-4xl px-3 items-center">
        <Card className="p-8 text-center border-red-200 bg-red-50 dark:bg-red-950/30 max-w-xl w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 h-8 w-8"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            </div>
            <h1 className="text-3xl font-bold text-red-700 dark:text-red-400">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md">
              We couldn't verify your order details. Please try again or contact our support team for assistance.
            </p>
            <div className="flex gap-4 mt-4">
              <Button asChild variant="outline">
                <Link href="/support">Contact Support</Link>
              </Button>
              <Button asChild>
                <Link href="/cart">Return to Cart</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col gap-8 max-w-4xl px-3 py-8">
      <Card className="p-8 shadow-md border-green-100 bg-gradient-to-b from-white to-green-50/50 dark:from-gray-950 dark:to-green-950/10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-in zoom-in duration-500 delay-300 rounded-full bg-green-100 p-5 dark:bg-green-900/30">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="animate-in fade-in duration-500 delay-500 text-3xl font-bold">
            Order Confirmed!
          </h1>
          <p className="animate-in fade-in duration-500 delay-700 text-muted-foreground max-w-lg">
            Thank you for your purchase. We've sent a confirmation email to{" "}
            <span className="font-medium">{sessionData?.customer_email}</span> with your order details.
          </p>
        </div>
      </Card>

      {sessionData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 col-span-1 md:col-span-2 animate-in fade-in duration-500 delay-200">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5" />
              Order Summary
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-medium">{sessionData.metadata?.orderId}</span>
              </div>
              {sessionData.metadata?.characterName && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Character Name</span>
                  <span className="font-medium">{sessionData.metadata.characterName}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Order Date</span>
                <span className="font-medium">{formatDate(sessionData.created || 0)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Payment Status</span>
                <span className="font-medium capitalize">
                  <span className={`inline-block rounded-full w-2 h-2 mr-2 ${
                    sessionData.payment_status === 'succeeded' ? 'bg-green-500' : 
                    sessionData.payment_status === 'processing' ? 'bg-blue-500' : 
                    'bg-amber-500'
                  }`}></span>
                  {sessionData.payment_status || sessionData.status}
                </span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span>{formatCurrency(sessionData.amount_total, sessionData.currency)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-in fade-in duration-500 delay-400">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Package className="h-5 w-5" />
              What's Next
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="flex-shrink-0 bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center text-primary">1</span>
                <div>
                  <p className="font-medium">Order Processing</p>
                  <p className="text-sm text-muted-foreground">We're preparing your items</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center text-primary">2</span>
                <div>
                  <p className="font-medium">Shipping</p>
                  <p className="text-sm text-muted-foreground">Your items will be on their way soon</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center text-primary">3</span>
                <div>
                  <p className="font-medium">Delivery</p>
                  <p className="text-sm text-muted-foreground">Expected to arrive within 3-5 business days</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      )}

      <div className="flex gap-4 justify-center animate-in fade-in duration-500 delay-600">
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Link>
        </Button>
        <Button asChild className="gap-2">
          <Link href="/orders">
            <Calendar className="h-4 w-4" />
            View Orders
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="flex-1 w-full flex flex-col items-center">
      <Suspense fallback={
        <div className="animate-in flex-1 flex flex-col gap-6 max-w-4xl px-3 items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <h1 className="text-3xl font-bold">Loading...</h1>
          </div>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </main>
  );
} 
 