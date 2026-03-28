"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import type { RecentOrder } from "./dashboardTypes";

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount || 0);
}

const statusColumns = {
  processing: {
    title: "Processando",
    color: "bg-yellow-500",
    nextStatus: "waiting_delivery" as const,
    prevStatus: null,
  },
  waiting_delivery: {
    title: "Aguardando Entrega",
    color: "bg-blue-500",
    nextStatus: "completed" as const,
    prevStatus: "processing" as const,
  },
  completed: {
    title: "Concluído",
    color: "bg-green-500",
    nextStatus: null,
    prevStatus: "waiting_delivery" as const,
  },
  failed: {
    title: "Falhou",
    color: "bg-red-500",
    nextStatus: null,
    prevStatus: "processing" as const,
  },
};

export default function ManageOrdersView() {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<
    ("processing" | "waiting_delivery" | "completed" | "failed")[]
  >(["processing", "waiting_delivery", "completed", "failed"]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToMove, setOrderToMove] = useState<{
    orderId: string;
    newStatus: "processing" | "waiting_delivery" | "completed" | "failed";
    orderNumber: string;
    direction: "next" | "prev";
  } | null>(null);

  useEffect(() => {
    fetchOrdersForManagement();
  }, []);

  const fetchOrdersForManagement = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch("/api/admin/orders");

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order");
      }

      // Atualizar a lista local
      fetchOrdersForManagement();
      toast.success("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update order status",
      );
    }
  };

  const getGridCols = () => {
    const count = selectedStatuses.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count === 3) return "grid-cols-1 md:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
  };

  const toggleStatus = (
    status: "processing" | "waiting_delivery" | "completed" | "failed",
  ) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      }
      return [...prev, status];
    });
  };

  const getSelectedStatusText = () => {
    if (selectedStatuses.length === 4) return "Todos os Status";
    if (selectedStatuses.length === 0) return "Selecionar Status";
    return `${selectedStatuses.length} Status Selecionados`;
  };

  const handleMoveOrderClick = (
    orderId: string,
    newStatus: "processing" | "waiting_delivery" | "completed" | "failed",
    orderNumber: string,
    direction: "next" | "prev",
  ) => {
    setOrderToMove({ orderId, newStatus, orderNumber, direction });
    setConfirmDialogOpen(true);
  };

  const handleConfirmMove = async () => {
    if (orderToMove) {
      await updateOrderStatus(orderToMove.orderId, orderToMove.newStatus);
      setOrderToMove(null);
    }
    setConfirmDialogOpen(false);
  };

  if (ordersLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-card-foreground">
          Gerenciar Pedidos
        </h1>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[200px] justify-between bg-card border-border text-card-foreground"
              >
                {getSelectedStatusText()}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 opacity-50"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-4 bg-card border-border">
              <div className="space-y-4">
                {Object.entries(statusColumns).map(
                  ([status, { title, color }]) => (
                    <div
                      key={status}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={status}
                        checked={selectedStatuses.includes(
                          status as
                            | "processing"
                            | "waiting_delivery"
                            | "completed"
                            | "failed",
                        )}
                        onCheckedChange={() =>
                          toggleStatus(
                            status as
                              | "processing"
                              | "waiting_delivery"
                              | "completed"
                              | "failed",
                          )
                        }
                        className="border-border"
                      />
                      <label
                        htmlFor={status}
                        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${color}`}
                        />
                        {title}
                      </label>
                    </div>
                  ),
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            onClick={fetchOrdersForManagement}
            variant="outline"
            size="sm"
            className="border-border text-foreground hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className={`grid ${getGridCols()} gap-6 min-w-[800px]`}>
          {Object.entries(statusColumns)
            .filter(([status]) =>
              selectedStatuses.includes(
                status as
                  | "processing"
                  | "waiting_delivery"
                  | "completed"
                  | "failed",
              ),
            )
            .map(([status, { title, color, nextStatus }]) => {
              const statusOrders = orders.filter(
                (order) => order.status === status,
              );
              return (
                <div
                  key={status}
                  className="bg-muted/10 rounded-lg p-4 min-h-[600px]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-card-foreground">
                      {title}
                    </h2>
                    <Badge className={`${color} text-white text-xs`}>
                      {statusOrders.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {statusOrders.length > 0 ? (
                      statusOrders.map((order) => (
                        <Card
                          key={order.id}
                          className="bg-card border-border hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm font-bold text-card-foreground">
                                #{String(order.id).slice(0, 8)}
                              </CardTitle>
                              <Badge
                                className={`${color} text-white text-xs`}
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Personagem
                                </p>
                                <p className="text-sm font-medium text-card-foreground truncate">
                                  {order.character_name}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Email
                                </p>
                                <p className="text-xs text-card-foreground truncate">
                                  {order.email}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Valor Total
                                </p>
                                <p className="text-sm font-semibold text-card-foreground">
                                  {formatPrice(
                                    order.total_amount,
                                    order.currency,
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Data
                                </p>
                                <p className="text-xs text-card-foreground">
                                  {new Date(
                                    order.created_at,
                                  ).toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-border pt-3">
                              <p className="text-xs text-muted-foreground mb-2">
                                Itens
                              </p>
                              <div className="space-y-1">
                                {order.items
                                  .slice(0, 2)
                                  .map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between text-xs"
                                    >
                                      <span className="text-muted-foreground truncate flex-1 mr-2">
                                        {item.product.name}
                                      </span>
                                      <span className="text-muted-foreground whitespace-nowrap">
                                        {formatPrice(
                                          item.product.price *
                                            item.quantity,
                                          order.currency,
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                {order.items.length > 2 && (
                                  <p className="text-xs text-muted-foreground">
                                    +{order.items.length - 2} mais itens
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              {nextStatus && (
                                <Button
                                  onClick={() =>
                                    handleMoveOrderClick(
                                      order.id,
                                      nextStatus,
                                      String(order.id).slice(0, 8),
                                      "next",
                                    )
                                  }
                                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2"
                                >
                                  Mover para{" "}
                                  {statusColumns[nextStatus].title}
                                </Button>
                              )}
                              {statusColumns[
                                status as keyof typeof statusColumns
                              ].prevStatus && (
                                <Button
                                  onClick={() =>
                                    handleMoveOrderClick(
                                      order.id,
                                      statusColumns[
                                        status as keyof typeof statusColumns
                                      ].prevStatus!,
                                      String(order.id).slice(0, 8),
                                      "prev",
                                    )
                                  }
                                  variant="outline"
                                  className="w-full border-border text-foreground hover:bg-accent text-xs py-2"
                                >
                                  Voltar para{" "}
                                  {
                                    statusColumns[
                                      statusColumns[
                                        status as keyof typeof statusColumns
                                      ].prevStatus!
                                    ].title
                                  }
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground">
                        <p className="text-sm">Nenhum pedido</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmMove}
        title="Confirmar Movimentação"
        description={`Tem certeza que deseja ${orderToMove?.direction === "next" ? "mover" : "voltar"} o pedido #${orderToMove?.orderNumber || ""} ${orderToMove?.direction === "next" ? "para" : "para"} ${orderToMove ? statusColumns[orderToMove.newStatus].title : ""}?`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant="default"
      />
    </div>
  );
}
