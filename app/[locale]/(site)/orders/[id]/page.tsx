"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { 
  Loader2, Package, Clock, CheckCircle, XCircle, 
  Calendar, RefreshCcw, ShoppingBag, CreditCard, Shield, Sword, User, Map,
  ArrowLeft, ExternalLink, MessageSquare, Receipt, AlertCircle, QrCode
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Order } from "@/types";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import TawkTo from "@/components/tawTo";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { PixQRCodeModal } from "@/components/pix-qrcode-modal";
import { toast } from "sonner";
const formatPrice = (price: number, currency: string = 'USD') => {
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

export default function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [showPixQRCode, setShowPixQRCode] = useState(false);
  const [pixData, setPixData] = useState<{
    id: string;
    status: string;
    amount: number;
    qrCode: string;
    copyPaste: string;
    expiresAt: string;
  } | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('Orders');

  const handleContactSupport = () => {
    if (typeof window !== 'undefined' && window.Tawk_API && order) {
      // Set visitor information
      window.Tawk_API.setAttributes({
        'name': order.character_name,
        'email': order.email,
        'orderId': order.id,
        'orderStatus': order.status,
        'orderAmount': `${order.total_amount} ${order.currency}`
      }, function(error: any) {
        if (error) {
          console.error('Error setting Tawk.to attributes:', error);
        }
      });

      // Handle chat window state
      window.Tawk_API.onChatMinimized = function() {
        // When chat is minimized, we can perform any cleanup if needed
        console.log('Chat minimized');
      };

      window.Tawk_API.onChatHidden = function() {
        // When chat is hidden, we can perform any cleanup if needed
        console.log('Chat hidden');
      };

      window.Tawk_API.onChatEnded = function() {
        // When chat is ended, we can perform any cleanup if needed
        console.log('Chat ended');
      };

      // If chat is already open, close it first
      if (window.Tawk_API.isVisitorEngaged()) {
        window.Tawk_API.endChat();
      }

      // Start a new chat session
      window.Tawk_API.maximize();
    }
  };

  const handleCancelOrder = () => {
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    // Navigate to support tickets page
    router.push('/support/tickets');
  };

  const handleViewPixQRCode = async () => {
    if (!order?.id) return;

    setLoadingPix(true);

    try {
      console.log('🔍 Buscando dados do PIX para pedido:', order.id);

      const response = await fetch(`/api/pix/by-order/${order.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.paymentConfirmed) {
          toast.info("Pagamento já confirmado", {
            description: "Este pedido já teve o pagamento confirmado.",
            duration: 5000,
          });
          return;
        }
        throw new Error(result.error || 'Erro ao buscar QR Code PIX');
      }

      console.log('✅ Dados do PIX obtidos:', result);
      console.log('📷 QR Code recebido:', {
        hasQrCode: !!result.qrCode,
        qrCodeLength: result.qrCode?.length,
        qrCodePreview: result.qrCode?.substring(0, 100),
      });

      setPixData(result);
      setShowPixQRCode(true);

    } catch (error) {
      console.error('❌ Erro ao buscar QR Code PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast.error("Erro ao carregar QR Code", {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setLoadingPix(false);
    }
  };

  const handleGenerateNewPixQRCode = async () => {
    if (!order?.id) return;

    setLoadingPix(true);
    setShowPixQRCode(false);

    try {
      console.log('🔄 Gerando novo QR Code PIX para pedido:', order.id);

      // Calcular o valor em centavos
      const amountInCents = Math.round(order.total_amount * 100);

      // Buscar dados do PIX anterior para obter informações do cliente
      let customerData = {
        taxId: '',
        cellphone: '',
        email: order.email,
      };

      try {
        const pixResponse = await fetch(`/api/pix/by-order/${order.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (pixResponse.ok) {
          const pixResult = await pixResponse.json();
          console.log('📋 Dados do PIX anterior:', pixResult);
          
          if (pixResult.customer) {
            customerData = {
              taxId: pixResult.customer.taxId || '',
              cellphone: pixResult.customer.cellphone || '',
              email: pixResult.customer.email || order.email,
            };
            
            console.log('✅ Dados do cliente recuperados:', {
              hasTaxId: !!customerData.taxId,
              hasCellphone: !!customerData.cellphone,
              hasEmail: !!customerData.email,
            });
          }
        }
      } catch (error) {
        console.log('⚠️ Não foi possível buscar dados do PIX anterior');
      }

      // Validar se temos todos os dados necessários
      if (!customerData.taxId || !customerData.cellphone || !customerData.email) {
        console.error('❌ Dados do cliente incompletos:', customerData);
        toast.error("Dados incompletos", {
          description: "Por favor, entre em contato com o suporte para gerar um novo QR Code. Os dados do cliente não estão disponíveis.",
          duration: 7000,
        });
        
        // Abrir chat de suporte
        if (typeof window !== 'undefined' && window.Tawk_API) {
          handleContactSupport();
        }
        
        return;
      }

      // Criar novo PIX
      console.log('📤 Enviando requisição para criar novo PIX:', {
        orderId: order.id,
        amount: amountInCents,
        customer: {
          hasTaxId: !!customerData.taxId,
          hasCellphone: !!customerData.cellphone,
          hasEmail: !!customerData.email,
        },
      });

      const response = await fetch('/api/pix/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents,
          expiresIn: 900, // 15 minutos
          description: `Pedido Path of Trade - ${order.character_name}`,
          customer: customerData,
          characterName: order.character_name,
          observations: order.observations,
          items: order.items,
          orderId: order.id, // Vincular ao pedido existente
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Erro ao gerar novo PIX:', result);
        throw new Error(result.error || 'Falha ao gerar novo QR Code PIX');
      }

      console.log('✅ Novo QR Code PIX gerado com sucesso:', {
        id: result.id,
        status: result.status,
        amount: result.amount,
        expiresAt: result.expiresAt,
        orderId: result.orderId,
      });

      // O pedido já foi atualizado pela API, não é necessário fazer aqui
      
      // Salvar dados do novo PIX
      setPixData(result);
      setShowPixQRCode(true);

      toast.success("Novo QR Code PIX gerado!", {
        description: `Valor: R$ ${(result.amount / 100).toFixed(2)} - Expira em 15 minutos`,
        duration: 5000,
      });

    } catch (error) {
      console.error('❌ Erro ao gerar novo QR Code PIX:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast.error("Erro ao gerar novo QR Code", {
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setLoadingPix(false);
    }
  };

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session?.user) {
          router.push('/auth/login');
          return;
        }

        // Fetch specific order for current user
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', session.user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Order not found');
        
        setOrder(data);
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        setError(error.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrderDetails();
  }, [params.id, router, supabase]);

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

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" className="mb-8 gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          {t("backToOrders")}
        </Button>
        
        <Card className="p-12 max-w-2xl mx-auto text-center border border-dashed">
          <div className="rounded-full bg-red-100 dark:bg-red-950/50 p-6 mx-auto w-24 h-24 flex items-center justify-center mb-6">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold mb-3">{t("orderNotFound")}</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {error || t("orderNotFoundDescription")}
          </p>
          <Button asChild size="lg" className="px-8 gap-2">
            <Link href="/orders">
              <Package className="h-5 w-5" />
              {t("viewAllOrders")}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        {t("backToOrders")}
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {/* PIX Payment Alert */}
        {order.pix_qrcode_id && order.payment_status !== 'succeeded' && order.status !== 'waiting_delivery' && (
          <div className="lg:col-span-3 mb-2">
            <Card className="border-l-4 border-l-red-500">
              <div className="p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <QrCode className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Aguardando pagamento via PIX</p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  className="gap-2 flex-shrink-0"
                  onClick={handleViewPixQRCode}
                  disabled={loadingPix}
                >
                  {loadingPix ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="hidden sm:inline">Carregando</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Ver PIX</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <Card className="p-5 mb-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-0 mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">{t("order")} #{order.id}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(order.created_at)}
                </div>
              </div>
              <Badge variant="outline" className={`px-3 py-1.5 ${getStatusColor(order.status)}`}>
                {getDeliveryStatusIcon(order.status)} 
                <span className="ml-1">{formatStatus(order.status || 'processing')}</span>
              </Badge>
            </div>
            
            <Separator className="mb-4" />
            
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t("orderItems")}
                </h2>
                
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-3 bg-muted/30 rounded-md border">
                      <div className="flex flex-col gap-1.5">
                        <div className="font-medium">
                          {item.product?.name || 'Unknown Item'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {(item.product as any)?.difficulty && (
                            <>
                              <span>Difficulty:</span>
                              <Badge variant="outline" className={
                                (item.product as any).difficulty.toLowerCase() === 'softcore' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900' :
                                (item.product as any).difficulty.toLowerCase() === 'hardcore' ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900' :
                                'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900'
                              }>
                                {(item.product as any).difficulty}
                              </Badge>
                            </>
                          )}
                        </div>
                        {(item.product as any)?.description && (
                          <div className="text-sm text-muted-foreground italic">{(item.product as any).description}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="font-medium">
                          {formatPrice(item.product?.price * item.quantity || 0, order.currency)}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Qty: {item.quantity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center py-1.5">
                <span className="font-medium">{t("subtotal")}</span>
                <span>{formatPrice(order.total_amount, order.currency)}</span>
              </div>
              
              {(order as any).delivery_fee > 0 && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="font-medium">Delivery Fee</span>
                  <span>{formatPrice((order as any).delivery_fee, order.currency)}</span>
                </div>
              )}
              
              {(order as any).discount_amount > 0 && (
                <div className="flex justify-between items-center py-1.5 text-green-600">
                  <span className="font-medium">{t("discount")}</span>
                  <span>-{formatPrice((order as any).discount_amount, order.currency)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between items-center py-1.5">
                <span className="font-bold text-lg">{t("total")}</span>
                <span className="font-bold text-lg">
                  {formatPrice(order.total_amount, order.currency)}
                </span>
              </div>
            </div>
            
            {/* Observations */}
            {order.observations && (
              <div className="mt-4 p-3 border border-border/70 rounded-md bg-muted/30">
                <h3 className="font-medium flex items-center gap-2 mb-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Observations
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {order.observations}
                </p>
              </div>
            )}

            {/* Delivery Instructions */}
            {(order as any).delivery_instructions && (
              <div className="mt-4 p-3 border border-border/70 rounded-md bg-muted/30">
                <h3 className="font-medium flex items-center gap-2 mb-1.5">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Delivery Instructions
                </h3>
                <p className="text-sm text-muted-foreground">
                  {(order as any).delivery_instructions}
                </p>
              </div>
            )}
          </Card>
          
          {/* Payment History - Stripe */}
          {order.payment_intent && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Payment Information
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md border">
                  <div className="flex flex-col">
                    <div className="text-sm text-muted-foreground">Payment Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentStatusIcon(order.payment_intent.status)}
                      <span className="font-medium">{formatStatus(order.payment_intent.status)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="font-medium mt-1">
                      {formatPrice(order.total_amount, order.currency)}
                    </div>
                  </div>
                </div>
                
                {(order.payment_intent as any).payment_method_types && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    Payment Method: {(order.payment_intent as any).payment_method_types.join(', ')}
                  </div>
                )}
                
                {(order.payment_intent as any).created && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Payment Date: {formatDate(new Date((order.payment_intent as any).created * 1000).toISOString())}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
        
        {/* Order Meta & Actions Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t("deliveryInformation")}
            </h2>
            
            <div className="space-y-3">
              {order.character_name && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">{t("characterName")}</span>
                  <span className="font-medium">{order.character_name}</span>
                </div>
              )}
              
              {/* Extract league from first item if available */}
              {order.items && order.items.length > 0 && order.items[0].product?.league && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">{t("league")}</span>
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{order.items[0].product.league}</span>
                  </div>
                </div>
              )}
              

              {(order as any).estimated_delivery && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">Estimated Delivery</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{formatDate((order as any).estimated_delivery)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <Button className="w-full gap-2" onClick={handleContactSupport}>
                <MessageSquare className="h-4 w-4" />
                {t("contactSupport")}
              </Button>

              
              {(order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed') ? (
                <Button variant="outline" className="w-full gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Buy Again
                </Button>
              ) : (
                order.status?.toLowerCase() !== 'cancelled' && order.status?.toLowerCase() !== 'canceled' && order.status?.toLowerCase() !== 'failed' && (
                  <>
                    {/* Cancel Order Warning */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-md">
                      <div className="flex gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                            {t("cancelOrderWarningTitle")}
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            {t("cancelOrderWarningDescription")}
                          </p>
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mt-2">
                            {t("subject")}: Cancel Order #{order.id}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
                      onClick={handleCancelOrder}
                    >
                      <XCircle className="h-4 w-4" />
                      {t("openCancellationTicket")}
                    </Button>
                  </>
                )
              )}
            </div>
          </Card>
        </div>
      </div>

      <ConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        title={t("confirmCancelTitle")}
        description={t("confirmCancelDescription")}
        confirmText={t("proceed")}
        cancelText={t("goBack")}
        variant="destructive"
      />

      {/* PIX QR Code Modal */}
      <PixQRCodeModal
        open={showPixQRCode}
        onOpenChange={setShowPixQRCode}
        pixData={pixData}
        onPaymentConfirmed={() => {
          setShowPixQRCode(false);
          // Recarregar dados do pedido
          window.location.reload();
        }}
        onGenerateNewPix={handleGenerateNewPixQRCode}
      />
    </div>
  );
} 