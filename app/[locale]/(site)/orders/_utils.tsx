import { CheckCircle, Clock, RefreshCcw, XCircle, CreditCard, Sword } from "lucide-react";

export const formatPrice = (price: number, currency: string = 'USD') => {
  if (currency.toLowerCase() === 'chaos' || currency.toLowerCase() === 'exalted') {
    return `${price} ${currency}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(price);
};

export const formatDate = (dateString: string, includeTime = false) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  });
};

export const formatStatus = (status: string | null) => {
  if (!status) return 'Unknown';
  const poeStatusMap: Record<string, string> = {
    waiting_delivery: 'Ready for Delivery',
    delivered: 'Items Delivered',
    processing: 'Processing Payment',
    ready_for_pickup: 'Ready for Pickup',
    in_progress: 'Order Processing',
  };
  return poeStatusMap[status.toLowerCase()] ?? status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed': case 'waiting_delivery': case 'delivered': case 'succeeded':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900';
    case 'ready_for_pickup':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900';
    case 'pending': case 'processing': case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900';
    case 'cancelled': case 'canceled': case 'failed':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900';
    default:
      return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900';
  }
};

export const getDeliveryStatusIcon = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'completed': case 'delivered': case 'waiting_delivery':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'ready_for_pickup':
      return <Sword className="h-5 w-5 text-emerald-500" />;
    case 'in_progress': case 'processing':
      return <RefreshCcw className="h-5 w-5 text-blue-500" />;
    case 'cancelled': case 'canceled': case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-amber-500" />;
  }
};

export const getPaymentStatusIcon = (status: string | null) => {
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
