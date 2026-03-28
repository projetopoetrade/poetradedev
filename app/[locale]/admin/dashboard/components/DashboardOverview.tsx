"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Users,
  ShoppingCart,
  Settings,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import type { DashboardStats, RecentOrder, RangeKey, StatusKey } from "./dashboardTypes";

interface DashboardOverviewProps {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  filters: { range: RangeKey; status: StatusKey };
  onFiltersChange: (filters: { range: RangeKey; status: StatusKey }) => void;
  onViewChange: (view: string) => void;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "processing":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "waiting_delivery":
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "processing":
      return "bg-yellow-500";
    case "waiting_delivery":
      return "bg-blue-500";
    case "failed":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function formatCurrency(amount: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
    amount || 0,
  );
}

export default function DashboardOverview({
  stats,
  recentOrders,
  filters,
  onFiltersChange,
  onViewChange,
}: DashboardOverviewProps) {
  const pct = useMemo(() => {
    const total =
      stats.completedOrders +
        stats.processingOrders +
        stats.waitingDeliveryOrders +
        stats.failedOrders || 1;
    return {
      completed: Math.round((stats.completedOrders / total) * 100),
      processing: Math.round((stats.processingOrders / total) * 100),
      waitingDelivery: Math.round((stats.waitingDeliveryOrders / total) * 100),
      failed: Math.round((stats.failedOrders / total) * 100),
    };
  }, [
    stats.completedOrders,
    stats.processingOrders,
    stats.waitingDeliveryOrders,
    stats.failedOrders,
  ]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Intervalo
            </span>
          </div>
          <Select
            value={filters.range}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, range: value as RangeKey })
            }
          >
            <SelectTrigger className="w-[140px] bg-card border-border text-card-foreground focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="24h">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Últimas 24h
                </div>
              </SelectItem>
              <SelectItem value="7d">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  7 dias
                </div>
              </SelectItem>
              <SelectItem value="30d">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  30 dias
                </div>
              </SelectItem>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  Tudo
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Status
            </span>
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, status: value as StatusKey })
            }
          >
            <SelectTrigger className="w-[140px] bg-card border-border text-card-foreground focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  Todos
                </div>
              </SelectItem>
              <SelectItem value="completed">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Concluídos
                </div>
              </SelectItem>
              <SelectItem value="processing">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  Processando
                </div>
              </SelectItem>
              <SelectItem value="waiting_delivery">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Aguardando Entrega
                </div>
              </SelectItem>
              <SelectItem value="failed">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  Falhos
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-card-foreground">
              {formatCurrency(stats.revenue, "BRL")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-card-foreground">
              {stats.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              24h: {stats.last24hOrders}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-card-foreground">
              {formatCurrency(stats.avgOrderValue, "BRL")}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-card-foreground">
              {(stats.completionRate * 100).toFixed(0)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por status */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Status dos pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-2 w-full rounded bg-muted overflow-hidden flex">
            <div
              className="h-full bg-green-500"
              style={{ width: `${pct.completed}%` }}
            />
            <div
              className="h-full bg-yellow-500"
              style={{ width: `${pct.processing}%` }}
            />
            <div
              className="h-full bg-blue-500"
              style={{ width: `${pct.waitingDelivery}%` }}
            />
            <div
              className="h-full bg-red-500"
              style={{ width: `${pct.failed}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-card-foreground flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded bg-green-500" />{" "}
              Concluídos {stats.completedOrders} ({pct.completed}%)
            </span>
            <span className="text-card-foreground flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded bg-yellow-500" />{" "}
              Processando {stats.processingOrders} ({pct.processing}%)
            </span>
            <span className="text-card-foreground flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded bg-blue-500" />{" "}
              Aguardando Entrega {stats.waitingDeliveryOrders} (
              {pct.waitingDelivery}%)
            </span>
            <span className="text-card-foreground flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded bg-red-500" />{" "}
              Falhos {stats.failedOrders} ({pct.failed}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Secundário: totais rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-card-foreground">
              {stats.totalProducts}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ligas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-card-foreground">
              {stats.totalLeagues}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sistema
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-card-foreground">DB</span>
              <Badge className="bg-green-500 text-white">Online</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-card-foreground">API</span>
              <Badge className="bg-green-500 text-white">Online</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-card-foreground">Cache</span>
              <Badge className="bg-green-500 text-white">Ativo</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recentes */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-card-foreground">
            Pedidos recentes
          </CardTitle>
          <Button
            onClick={() => onViewChange("orders")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ver todos
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(order.status)}
                    <div>
                      <p className="text-card-foreground font-medium">
                        #{String(order.id).slice(0, 8)}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {order.character_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-card-foreground font-medium">
                      {formatCurrency(
                        order.total_amount,
                        (order.currency || "BRL").toUpperCase(),
                      )}
                    </p>
                    <Badge
                      className={`${getStatusColor(order.status)} text-white`}
                    >
                      {order.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Sem pedidos recentes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
