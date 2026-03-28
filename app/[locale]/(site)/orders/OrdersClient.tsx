"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, ChevronLeft, User, Map, Shield } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Order } from "@/types";
import {
  formatPrice, formatDate, formatStatus,
  getStatusColor, getDeliveryStatusIcon,
} from "./_utils";

const ITEMS_PER_PAGE = 5;

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();
  const t = useTranslations("Orders");

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto px-4 py-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-center md:text-left">{t("title")}</h1>
          <p className="text-muted-foreground text-center md:text-left">{t("trackDeliveryStatus")}</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("showing")} {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, orders.length)} {t("of")} {orders.length} {t("orders")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 max-w-5xl mx-auto">
        {paginatedOrders.map((order) => (
          <Card key={order.id} className="group overflow-hidden border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300">
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0 mb-6 pb-4 border-b">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h2 className="text-xl font-semibold">{t("order")} #{order.id}</h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <Badge variant="outline" className={`px-3 py-1 ${getStatusColor(order.status)}`}>
                  {getDeliveryStatusIcon(order.status)}
                  <span className="ml-1">{formatStatus(order.status || "processing")}</span>
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
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
                  {order.items?.[0]?.product?.league && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">{t("league")}</span>
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">{order.items[0].product.league}</span>
                      </div>
                    </div>
                  )}
                  {(order.items?.[0]?.product as any)?.difficulty && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">{t("difficulty")}</span>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <Badge variant="outline" className={
                          (order.items[0].product as any).difficulty.toLowerCase() === "softcore"
                            ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900"
                            : (order.items[0].product as any).difficulty.toLowerCase() === "hardcore"
                            ? "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-900"
                            : "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900"
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
                  {order.payment_intent?.status && (
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground mb-1">{t("paymentStatus")}</span>
                      <span>{formatStatus(order.payment_intent.status)}</span>
                    </div>
                  )}
                </div>

                <div className="col-span-2 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">
                      Items ({order.items.reduce((t, i) => t + i.quantity, 0)} total)
                    </span>
                  </div>
                  <div className="space-y-3">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between py-2 px-3 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="font-medium">{item.product?.name || "Unknown Item"}</div>
                          <Badge variant="outline" className="text-xs">Qty: {item.quantity}</Badge>
                        </div>
                        <div className="font-medium">
                          {formatPrice(((item as any)?.priceInCurrency ?? item.product?.price ?? 0) * item.quantity, order.currency)}
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

              <div className="flex justify-end mt-6">
                <Button className="gap-2" onClick={() => router.push(`/orders/${order.id}`)}>
                  {t("viewOrderDetails")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-12 gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            {t("previous")}
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const show = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
              const ellipsis = (page === currentPage - 2 && currentPage > 3) || (page === currentPage + 2 && currentPage < totalPages - 2);
              if (ellipsis) return <span key={page} className="px-2 text-muted-foreground">...</span>;
              if (!show) return null;
              return (
                <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm"
                  onClick={() => handlePageChange(page)} className={currentPage === page ? "pointer-events-none" : ""}>
                  {page}
                </Button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="gap-1">
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
