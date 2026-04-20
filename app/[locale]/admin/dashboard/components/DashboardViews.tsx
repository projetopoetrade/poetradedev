"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats, RecentOrder, RangeKey, StatusKey } from "./dashboardTypes";

import DashboardOverview from "./DashboardOverview";
import AddProductView from "./AddProductView";
import BulkProductsView from "./BulkProductsView";
import AddLeagueView from "./AddLeagueView";
import ManageProductsView from "./ManageProductsView";
import ManageLeaguesView from "./ManageLeaguesView";
import ManageOrdersView from "./ManageOrdersView";
import CacheView from "./CacheView";
import ManageBuildsView from "./ManageBuildsView";
import AddBuildView from "./AddBuildView";
import HardwareDealsView from "./HardwareDealsView";
import PCBuilderView from "./PCBuilderView";
import VMCalculatorView from "./VMCalculatorView";

interface DashboardViewsProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

type StatusNormalized = "completed" | "processing" | "waiting_delivery" | "failed";

function normalizeStatus(s: string): StatusNormalized | string {
  if (s === "waiting_delivery") return "waiting_delivery";
  if (s === "completed" || s === "processing" || s === "failed") return s;
  return s;
}

function computeStats(
  allOrders: RecentOrder[],
  f: { range: RangeKey; status: StatusKey },
  prev: DashboardStats,
): DashboardStats {
  const now = Date.now();
  const rangeMsMap: Record<RangeKey, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    all: Number.POSITIVE_INFINITY,
  };

  const rangeMs = rangeMsMap[f.range];
  const inRange = allOrders.filter(
    (o) => now - new Date(o.created_at).getTime() <= rangeMs,
  );
  const statusFiltered =
    f.status === "all"
      ? inRange
      : inRange.filter((o) => normalizeStatus(o.status) === f.status);

  const completed = statusFiltered.filter(
    (o) => normalizeStatus(o.status) === "completed",
  );
  const processing = statusFiltered.filter(
    (o) => normalizeStatus(o.status) === "processing",
  );
  const waitingDelivery = statusFiltered.filter(
    (o) => normalizeStatus(o.status) === "waiting_delivery",
  );
  const failed = statusFiltered.filter(
    (o) => normalizeStatus(o.status) === "failed",
  );

  const revenue = completed.reduce(
    (acc, o) => acc + (Number(o.total_amount) || 0),
    0,
  );
  const totalOrders = statusFiltered.length;
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
  const completionRate = totalOrders > 0 ? completed.length / totalOrders : 0;

  const last24h = allOrders.filter(
    (o) => now - new Date(o.created_at).getTime() <= 24 * 60 * 60 * 1000,
  ).length;

  return {
    ...prev,
    totalOrders,
    completedOrders: completed.length,
    processingOrders: processing.length,
    waitingDeliveryOrders: waitingDelivery.length,
    failedOrders: failed.length,
    revenue,
    avgOrderValue,
    completionRate,
    last24hOrders: last24h,
  };
}

export default function DashboardViews({
  activeView,
  onViewChange,
}: DashboardViewsProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalLeagues: 0,
    totalOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    waitingDeliveryOrders: 0,
    failedOrders: 0,
    revenue: 0,
    avgOrderValue: 0,
    completionRate: 0,
    last24hOrders: 0,
  });

  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    range: RangeKey;
    status: StatusKey;
  }>({
    range: "7d",
    status: "all",
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchAll(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setStats((prev) => computeStats(orders, filters, prev));
  }, [filters, orders]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ count: productsCount }, { count: leaguesCount }] =
        await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("leagues").select("*", { count: "exact", head: true }),
        ]);

      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      const allOrders: RecentOrder[] = await response.json();

      allOrders.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      setOrders(allOrders);
      setRecentOrders(allOrders.slice(0, 5));
      setStats((prev) => ({
        ...prev,
        totalProducts: productsCount || 0,
        totalLeagues: leaguesCount || 0,
      }));
    } catch (e) {
      console.error("Erro ao buscar dados do dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardOverview
            stats={stats}
            recentOrders={recentOrders}
            filters={filters}
            onFiltersChange={setFilters}
            onViewChange={onViewChange}
          />
        );

      case "add-product":
        return <AddProductView />;

      case "bulk-products":
        return <BulkProductsView />;

      case "add-league":
        return <AddLeagueView onSuccess={fetchAll} />;

      case "manage-products":
        return <ManageProductsView />;

      case "manage-leagues":
        return <ManageLeaguesView onLeagueDeleted={fetchAll} />;

      case "orders":
        return <ManageOrdersView />;

      case "cache":
        return <CacheView />;

      case "builds":
        return (
          <ManageBuildsView onAddBuild={() => onViewChange("add-build")} />
        );

      case "add-build":
        return (
          <AddBuildView
            onSuccess={() => onViewChange("builds")}
            onCancel={() => onViewChange("builds")}
          />
        );

      case "hardware-deals":
        return <HardwareDealsView />;

      case "pc-builder":
        return <PCBuilderView />;

      case "vm-calculator":
        return <VMCalculatorView />;

      default:
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Página não encontrada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  A página solicitada não foi encontrada.
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return <div className="space-y-6">{renderView()}</div>;
}
