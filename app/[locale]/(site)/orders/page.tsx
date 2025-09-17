"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { 
  Loader2, Package, Clock, CheckCircle, XCircle, ChevronRight, 
  Calendar, RefreshCcw, ShoppingBag, CreditCard, Tag, Shield, Sword, User, Map
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Order } from "@/types";
import { useTranslations } from "next-intl";


const formatPrice = (price: number, currency: string = 'USD') => {
  // Handle Path of Exile currency formatting
  if (currency.toLowerCase() === 'chaos' || currency.toLowerCase() === 'exalted') {
    return `${price} ${currency}`;
  }
  
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency.toUpperCase()
  }).format(price);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const getDeliveryStatusIcon = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'delivered':
    case 'waiting_delivery':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'ready_for_pickup':
      return <Sword className="h-5 w-5 text-emerald-500" />;
    case 'in_progress':
    case 'processing':
      return <RefreshCcw className="h-5 w-5 text-blue-500" />;
    case 'cancelled':
    case 'canceled':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-amber-500" />;
  }
};

const getPaymentStatusIcon = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'succeeded':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'processing':
      return <RefreshCcw className="h-5 w-5 text-blue-500" />;
    case 'requires_payment_method':
      return <CreditCard className="h-5 w-5 text-amber-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const formatStatus = (status: string | null) => {
  if (!status) return 'Unknown';
  
  // PoE-specific status naming
  const poeStatusMap: Record<string, string> = {
    'waiting_delivery': 'Ready for Delivery',
    'delivered': 'Items Delivered',
    'processing': 'Processing Payment',
    'ready_for_pickup': 'Ready for Pickup',
    'in_progress': 'Order Processing',
  };
  
  if (poeStatusMap[status.toLowerCase()]) {
    return poeStatusMap[status.toLowerCase()];
  }
  
  // Default formatting: Replace underscores with spaces and capitalize each word
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'waiting_delivery':
    case 'delivered':
    case 'succeeded':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900';
    case 'ready_for_pickup':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900';
    case 'pending':
    case 'processing':
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900';
    case 'cancelled':
    case 'canceled':
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900';
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900';
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("Orders");


  useEffect(() => {
    async function fetchOrders() {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session?.user) {
          router.push('auth/login');
          return;
        }

        // Fetch orders for current user
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-medium">{t("loading")}</h2>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container min-h-[80vh] mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center md:text-left">{t("title")}</h1>
        <Card className="p-12 max-w-2xl mx-auto text-center border border-dashed">
          <div className="rounded-full bg-primary/10 p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">{t("noOrdersYet")}</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t("onceYouPlaceAnOrder")}
          </p>
          <Button asChild size="lg" className="px-8 gap-2">
            <Link href="/">
              <ShoppingBag className="h-5 w-5" />
              {t("browsePoEItems")}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-2 text-center md:text-left">{t("title")}</h1>
      <p className="text-muted-foreground mb-8 text-center md:text-left">
        {t("trackDeliveryStatus")}
      </p>
      
      <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
        {orders.map((order) => (
          <Card 
            key={order.id} 
            className="group overflow-hidden border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300"
          >
            <div className="p-6 md:p-8">
              {/* Order Header */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0 mb-6 pb-4 border-b">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h2 className="text-xl font-semibold">Order #{order.id}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className={`px-3 py-1 ${getStatusColor(order.status)}`}>
                    {getDeliveryStatusIcon(order.status)} 
                    <span className="ml-1">{formatStatus(order.status || 'processing')}</span>
                  </Badge>
                </div>
              </div>

              {/* Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                {/* Character & League Info */}
                <div className="col-span-1 space-y-4">
                  {order.character_name && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">{t("characterName")}</span>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium">{order.character_name}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Extract league from first item if available */}
                  {order.items && order.items.length > 0 && order.items[0].product?.league && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">{t("league")}</span>
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{order.items[0].product.league}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Difficulty */}
                  {order.items && order.items.length > 0 && (order.items[0].product as any)?.difficulty && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">{t("difficulty")}</span>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <Badge variant="outline" className={
                          (order.items[0].product as any).difficulty.toLowerCase() === 'softcore' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900' :
                          (order.items[0].product as any).difficulty.toLowerCase() === 'hardcore' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900' :
                          'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900'
                        }>
                          {(order.items[0].product as any).difficulty}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">{t("totalAmount")}</span>
                    <span className="text-lg font-semibold">{formatPrice(order.total_amount, order.currency)}</span>
                  </div>
                  
                  {/* Payment Status */}
                  {order.payment_intent?.status && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">{t("paymentStatus")}</span>
                      <div className="flex items-center gap-1.5">
                        {getPaymentStatusIcon(order.payment_intent.status)}
                        <span>{formatStatus(order.payment_intent.status)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Delivery Instructions - still using type assertion for safety */}
                  {(order as any).delivery_instructions && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">Delivery Notes</span>
                      <p className="text-sm border border-border/50 rounded p-2 bg-muted/30">
                        {(order as any).delivery_instructions}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Order Items */}
                <div className="col-span-2 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">
                      Items ({order.items.reduce((total, item) => total + item.quantity, 0)} total)
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between py-2 px-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">
                            {item.product?.name || 'Unknown Item'}
                            {(item.product as any)?.item_level && 
                              <span className="ml-2 text-xs text-muted-foreground">iLvl: {(item.product as any).item_level}</span>
                            }
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                        <div className="font-medium">
                          {formatPrice(item.product?.price * item.quantity || 0, order.currency)}
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-sm text-center py-1.5 border border-dashed rounded-md text-muted-foreground">
                        +{order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end mt-6">
                <Button 
                  className="gap-2"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  {t("viewOrderDetails")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 