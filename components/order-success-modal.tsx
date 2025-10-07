"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  Package, 
  Calendar, 
  User,
  CreditCard,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/contexts/cart-context";

interface OrderData {
  id: string | number;
  character_name: string;
  email: string;
  total_amount: number | string;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string;
  observations?: string;
  created_at: string;
  paid_at?: string | null;
}

interface OrderSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixQrCodeId: string | null;
}

const formatCurrency = (amount: number | string, currency = 'brl') => {
  // Converter para número se for string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Validar se é um número válido
  if (isNaN(numAmount)) {
    console.error('Invalid amount:', amount);
    return 'R$ 0,00';
  }
  
  const currencyUpper = (currency || 'brl').toUpperCase();
  
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currencyUpper,
    }).format(numAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `R$ ${numAmount.toFixed(2)}`;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function OrderSuccessModal({
  open,
  onOpenChange,
  pixQrCodeId,
}: OrderSuccessModalProps) {
  const t = useTranslations('Success');
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!open || !pixQrCodeId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/orders/by-pix/${pixQrCodeId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order');
        }

        console.log('📦 Dados do pedido recebidos:', data);
        console.log('💰 Total amount:', data.total_amount, 'Type:', typeof data.total_amount);
        console.log('💵 Currency:', data.currency, 'Type:', typeof data.currency);

        setOrderData(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [open, pixQrCodeId]);

  const isPaid = orderData?.payment_status === 'succeeded' || orderData?.payment_status === 'paid';

  const handleContinueShopping = () => {
    // Fechar modal primeiro para transição suave
    onOpenChange(false);
    
    // Aguardar um momento antes de limpar o carrinho
    setTimeout(() => {
      console.log('🧹 Limpando carrinho ao continuar comprando...');
      clearCart();
    }, 800); // 800ms de delay para navegação suave
  };

  const handleViewOrders = () => {
    // Fechar modal primeiro para transição suave
    onOpenChange(false);
    
    // Aguardar um momento antes de limpar o carrinho
    setTimeout(() => {
      console.log('🧹 Limpando carrinho ao ver pedidos...');
      clearCart();
    }, 800); // 800ms de delay para navegação suave
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            {t('orderConfirmed')}
          </DialogTitle>
          <DialogDescription>
            Seu pedido foi confirmado com sucesso!
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('processing')}</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && orderData && (
          <div className="space-y-4">
            {/* Informações do Pedido */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('orderId')}
                </span>
                <span className="text-sm font-mono font-medium">
                  {typeof orderData.id === 'string' 
                    ? `${orderData.id.slice(0, 8)}...` 
                    : orderData.id}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('characterName')}
                </span>
                <span className="text-sm font-medium">{orderData.character_name}</span>
              </div>

               <div className="flex justify-between items-center py-2 border-b">
                 <span className="text-sm text-muted-foreground flex items-center gap-2">
                   <Calendar className="h-4 w-4" />
                   {t('orderDate')}
                 </span>
                 <span className="text-sm font-medium">{formatDate(orderData.created_at)}</span>
               </div>

               {orderData.paid_at && (
                 <div className="flex justify-between items-center py-2 border-b">
                   <span className="text-sm text-muted-foreground flex items-center gap-2">
                     <CheckCircle2 className="h-4 w-4 text-green-600" />
                     {t('paidAt')}
                   </span>
                   <span className="text-sm font-medium text-green-600">{formatDate(orderData.paid_at)}</span>
                 </div>
               )}

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Status
                </span>
                <span className="text-sm font-medium capitalize flex items-center gap-2">
                  <span className={`inline-block rounded-full w-2 h-2 ${
                    isPaid ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
                  }`}></span>
                  {isPaid ? t('paid') : orderData.payment_status}
                </span>
              </div>

              {orderData.observations && (
                <div className="py-2 border-b">
                  <span className="text-sm text-muted-foreground block mb-1">Observações:</span>
                  <p className="text-sm">{orderData.observations}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold">{t('total')}</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(orderData.total_amount, orderData.currency)}
                </span>
              </div>
             </div>

            {/* Próximos Passos */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{t('whatsNext')}</h3>
              <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex gap-2">
                  <span className="font-semibold">1.</span>
                  <span>{t('step1Description')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">2.</span>
                  <span>{t('step2Description')}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold">3.</span>
                  <span>{t('step3Description')}</span>
                </li>
              </ol>
            </div>

             {/* Botões */}
             <div className="flex gap-2 pt-2">
               <Button
                 variant="outline"
                 className="flex-1"
                 onClick={handleContinueShopping}
                 asChild
               >
                 <Link href="/">
                   {t('continueShopping')}
                 </Link>
               </Button>
               <Button
                 className="flex-1 bg-green-600 hover:bg-green-700"
                 onClick={handleViewOrders}
                 asChild
               >
                 <Link href="/orders">
                   {t('viewOrders')}
                 </Link>
               </Button>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

