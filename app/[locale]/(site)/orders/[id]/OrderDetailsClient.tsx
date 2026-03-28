"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Loader2, Clock, XCircle,
  Calendar, ShoppingBag, CreditCard, Shield, User, Map,
  ArrowLeft, MessageSquare, Receipt, AlertCircle, QrCode
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Order } from "@/types";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { PixQRCodeModal } from "@/components/pix-qrcode-modal";
import { toast } from "sonner";
import {
  formatPrice, formatDate, formatStatus,
  getStatusColor, getDeliveryStatusIcon, getPaymentStatusIcon,
} from "../_utils";

interface PixData {
  id: string;
  status: string;
  amount: number;
  qrCode: string;
  copyPaste: string;
  expiresAt: string;
  customer?: { taxId?: string; cellphone?: string; email?: string };
}

export default function OrderDetailsClient({ order }: { order: Order }) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [showPixQRCode, setShowPixQRCode] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const router = useRouter();
  const t = useTranslations("Orders");

  const handleContactSupport = () => {
    if (typeof window !== "undefined" && window.Tawk_API) {
      window.Tawk_API.setAttributes(
        {
          name: order.character_name,
          email: order.email,
          orderId: order.id,
          orderStatus: order.status,
          orderAmount: `${order.total_amount} ${order.currency}`,
        },
        function (error: any) {
          if (error) console.error("Error setting Tawk.to attributes:", error);
        }
      );
      if (window.Tawk_API.isVisitorEngaged()) {
        window.Tawk_API.endChat();
      }
      window.Tawk_API.maximize();
    }
  };

  const handleConfirmCancel = () => {
    router.push("/support/tickets");
  };

  const handleViewPixQRCode = async () => {
    if (!order?.id) return;
    setLoadingPix(true);
    try {
      const response = await fetch(`/api/pix/by-order/${order.id}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.paymentConfirmed) {
          toast.info("Pagamento já confirmado", {
            description: "Este pedido já teve o pagamento confirmado.",
            duration: 5000,
          });
          return;
        }
        throw new Error(result.error || "Erro ao buscar QR Code PIX");
      }

      setPixData(result);
      setShowPixQRCode(true);
    } catch (error) {
      toast.error("Erro ao carregar QR Code", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
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
      const amountInCents = Math.round(order.total_amount * 100);
      let customerData = { taxId: "", cellphone: "", email: order.email };

      try {
        const pixResponse = await fetch(`/api/pix/by-order/${order.id}`);
        if (pixResponse.ok) {
          const pixResult = await pixResponse.json();
          if (pixResult.customer) {
            customerData = {
              taxId: pixResult.customer.taxId || "",
              cellphone: pixResult.customer.cellphone || "",
              email: pixResult.customer.email || order.email,
            };
          }
        }
      } catch {
        // Non-blocking — proceed with email only
      }

      if (!customerData.taxId || !customerData.cellphone || !customerData.email) {
        toast.error("Dados incompletos", {
          description:
            "Por favor, entre em contato com o suporte para gerar um novo QR Code.",
          duration: 7000,
        });
        if (typeof window !== "undefined" && window.Tawk_API) {
          handleContactSupport();
        }
        return;
      }

      const response = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInCents,
          expiresIn: 900,
          description: `Pedido Path of Trade - ${order.character_name}`,
          customer: customerData,
          characterName: order.character_name,
          observations: order.observations,
          items: order.items,
          orderId: order.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Falha ao gerar novo QR Code PIX");
      }

      setPixData(result);
      setShowPixQRCode(true);

      toast.success("Novo QR Code PIX gerado!", {
        description: `Valor: R$ ${(result.amount / 100).toFixed(2)} - Expira em 15 minutos`,
        duration: 5000,
      });
    } catch (error) {
      toast.error("Erro ao gerar novo QR Code", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
        duration: 5000,
      });
    } finally {
      setLoadingPix(false);
    }
  };

  const isCancelled =
    order.status?.toLowerCase() === "cancelled" ||
    order.status?.toLowerCase() === "canceled" ||
    order.status?.toLowerCase() === "failed";

  const isCompleted =
    order.status?.toLowerCase() === "delivered" ||
    order.status?.toLowerCase() === "completed";

  return (
    <div className="container mx-auto px-4 py-6 animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        {t("backToOrders")}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
        {/* PIX Payment Alert */}
        {order.pix_qrcode_id &&
          order.payment_status !== "succeeded" &&
          order.status !== "waiting_delivery" && (
            <div className="lg:col-span-3 mb-2">
              <Card className="border-l-4 border-l-red-500">
                <div className="p-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <QrCode className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Aguardando pagamento via PIX
                    </p>
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
                <h1 className="text-2xl font-bold mb-1">
                  {t("order")} #{order.id}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {formatDate(order.created_at, true)}
                </div>
              </div>
              <Badge
                variant="outline"
                className={`px-3 py-1.5 ${getStatusColor(order.status)}`}
              >
                {getDeliveryStatusIcon(order.status)}
                <span className="ml-1">
                  {formatStatus(order.status || "processing")}
                </span>
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
                    <div
                      key={index}
                      className="flex justify-between items-start p-3 bg-muted/30 rounded-md border"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="font-medium">
                          {item.product?.name || "Unknown Item"}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {(item.product as any)?.difficulty && (
                            <>
                              <span>Difficulty:</span>
                              <Badge
                                variant="outline"
                                className={
                                  (item.product as any).difficulty.toLowerCase() ===
                                  "softcore"
                                    ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900"
                                    : (item.product as any).difficulty.toLowerCase() ===
                                      "hardcore"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900"
                                    : "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900"
                                }
                              >
                                {(item.product as any).difficulty}
                              </Badge>
                            </>
                          )}
                        </div>
                        {(item.product as any)?.description && (
                          <div className="text-sm text-muted-foreground italic">
                            {(item.product as any).description}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="font-medium">
                          {formatPrice(
                            (((item as any)?.priceInCurrency ??
                              item.product?.price) || 0) * item.quantity,
                            order.currency
                          )}
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
                  <span>
                    {formatPrice((order as any).delivery_fee, order.currency)}
                  </span>
                </div>
              )}

              {(order as any).discount_amount > 0 && (
                <div className="flex justify-between items-center py-1.5 text-green-600">
                  <span className="font-medium">{t("discount")}</span>
                  <span>
                    -{formatPrice((order as any).discount_amount, order.currency)}
                  </span>
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

          {/* Payment Information — Stripe */}
          {order.payment_intent && (
            <Card className="p-5">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Payment Information
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-md border">
                  <div className="flex flex-col">
                    <div className="text-sm text-muted-foreground">
                      Payment Status
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentStatusIcon(order.payment_intent.status)}
                      <span className="font-medium">
                        {formatStatus(order.payment_intent.status)}
                      </span>
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
                    Payment Method:{" "}
                    {(order.payment_intent as any).payment_method_types.join(", ")}
                  </div>
                )}

                {(order.payment_intent as any).created && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Payment Date:{" "}
                    {formatDate(
                      new Date(
                        (order.payment_intent as any).created * 1000
                      ).toISOString(),
                      true
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {t("deliveryInformation")}
            </h2>

            <div className="space-y-3">
              {order.character_name && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">
                    {t("characterName")}
                  </span>
                  <span className="font-medium">{order.character_name}</span>
                </div>
              )}

              {order.items?.[0]?.product?.league && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">
                    {t("league")}
                  </span>
                  <div className="flex items-center gap-2">
                    <Map className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">
                      {order.items[0].product.league}
                    </span>
                  </div>
                </div>
              )}

              {(order as any).estimated_delivery && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm text-muted-foreground">
                    Estimated Delivery
                  </span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">
                      {formatDate((order as any).estimated_delivery, true)}
                    </span>
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

              {isCompleted ? (
                <Button variant="outline" className="w-full gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Buy Again
                </Button>
              ) : (
                !isCancelled && (
                  <>
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
                      onClick={() => setCancelDialogOpen(true)}
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

      <PixQRCodeModal
        open={showPixQRCode}
        onOpenChange={setShowPixQRCode}
        pixData={pixData}
        onPaymentConfirmed={() => {
          setShowPixQRCode(false);
          window.location.reload();
        }}
        onGenerateNewPix={handleGenerateNewPixQRCode}
      />
    </div>
  );
}
