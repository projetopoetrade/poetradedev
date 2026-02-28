"use client";

import { useState, useEffect, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import RevalidateCacheButton from "@/components/revalidate-cache-button";
import { toast } from "sonner";
import { newProduct } from "@/app/actions";
import { getProducts } from "@/app/actions";
import type { Product, Build } from "@/lib/interface";
import {
  POE1_CLASSES,
  POE2_CLASSES,
  BUILD_TAGS,
  getClassesForGameVersion,
} from "@/lib/builds-data";
import AscendancyImage from "@/components/Builds/AscendancyImage";
import {
  Package,
  Users,
  ShoppingCart,
  Settings,
  Plus,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Home,
  ChevronRight,
  Upload,
  Download,
  FileText,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";

interface DashboardStats {
  totalProducts: number;
  totalLeagues: number;
  totalOrders: number;
  completedOrders: number;
  processingOrders: number;
  waitingDeliveryOrders: number;
  failedOrders: number;
  revenue: number;
  avgOrderValue: number;
  completionRate: number;
  last24hOrders: number;
}

interface RecentOrder {
  id: string;
  character_name: string;
  email: string;
  total_amount: number;
  currency: string;
  status: "completed" | "processing" | "waiting_delivery" | "failed" | string;
  created_at: string;
  items: Array<{
    product: {
      id: string;
      name: string;
      description: string;
      price: number;
      imgUrl: string;
      category: string;
      gameVersion: string;
      league: string;
      difficulty: string;
    };
    quantity: number;
  }>;
}

type RangeKey = "24h" | "7d" | "30d" | "all";
type StatusKey =
  | "all"
  | "completed"
  | "processing"
  | "waiting_delivery"
  | "failed";

interface DashboardViewsProps {
  activeView: string;
  onViewChange: (view: string) => void;
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<{
    range: RangeKey;
    status: StatusKey;
  }>({
    range: "7d",
    status: "all",
  });

  // Product management states
  const [productsLoading, setProductsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [selectedGameVersion, setSelectedGameVersion] =
    useState<string>("All Versions");
  const [selectedLeague, setSelectedLeague] = useState<string>("All Leagues");
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<string>("All Difficulties");

  // Leagues for product management filters
  const [availableLeaguesForFilter, setAvailableLeaguesForFilter] = useState<
    Array<{ id: string; name: string; gameVersion: string }>
  >([]);
  const [loadingLeaguesForFilter, setLoadingLeaguesForFilter] = useState(false);

  // Manage Leagues view state
  type LeagueAdmin = {
    id: string;
    name: string;
    gameVersion: string;
    imageUrl: string;
    description: string | null;
    isActive: boolean;
    is_published: boolean;
    difficulty: string | null;
    poe_ninja_name: string | null;
    league_slug: string | null;
    updated_at: string | null;
  };
  const [leaguesList, setLeaguesList] = useState<LeagueAdmin[]>([]);
  const [leaguesListLoading, setLeaguesListLoading] = useState(false);
  const [leaguesGameVersionFilter, setLeaguesGameVersionFilter] = useState<"all" | "path-of-exile-1" | "path-of-exile-2">("all");

  // Orders management states
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

  // Form states
  const [productForm, setProductForm] = useState<Product>({
    name: "",
    league: "",
    category: "",
    slug: "",
    description: "",
    price: 0,
    gameVersion: "path-of-exile-1",
    imgUrl: "",
    difficulty: "",
    alt: "",
  });

  const [leagueForm, setLeagueForm] = useState<{
    name: string;
    imageUrl: string;
    gameVersion: "path-of-exile-1" | "path-of-exile-2";
    description: string;
    cloneFromLeague?: string;
    league_slug: string;
    isActive: boolean;
    is_published: boolean;
    difficulty: string;
    poe_ninja_name: string;
  }>({
    name: "",
    imageUrl: "",
    gameVersion: "path-of-exile-1",
    description: "",
    cloneFromLeague: "",
    league_slug: "",
    isActive: true,
    is_published: false,
    difficulty: "softcore",
    poe_ninja_name: "",
  });

  // Leagues state for product form
  const [availableLeagues, setAvailableLeagues] = useState<
    Array<{ id: string; name: string; gameVersion: string }>
  >([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  // Bulk products states
  const [bulkProducts, setBulkProducts] = useState<Product[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

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

  // Load products when manage-products view is active
  useEffect(() => {
    if (activeView === "manage-products" && products.length === 0) {
      fetchProducts();
    }
  }, [activeView]);

  // Load orders when orders view is active
  useEffect(() => {
    if (activeView === "orders" && orders.length === 0) {
      fetchOrdersForManagement();
    }
  }, [activeView]);

  // Load leagues when game version changes in product form
  useEffect(() => {
    if (activeView === "add-product" && productForm.gameVersion) {
      fetchLeaguesForProduct(productForm.gameVersion);
    }
  }, [productForm.gameVersion, activeView]);

  // Load leagues when game version changes in product management filters
  useEffect(() => {
    if (activeView === "manage-products" && selectedGameVersion) {
      fetchLeaguesForFilter(selectedGameVersion);
    }
  }, [selectedGameVersion, activeView]);

  useEffect(() => {
    computeAndSetStats(orders, filters);
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
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Erro ao buscar dados do dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeagues = async () => {
    setLeaguesListLoading(true);
    try {
      const res = await fetch("/api/admin/leagues/all", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch leagues");
      const data = await res.json();
      setLeaguesList(data);
    } catch (e) {
      console.error("Erro ao buscar ligas:", e);
      toast.error("Erro ao carregar ligas");
    } finally {
      setLeaguesListLoading(false);
    }
  };

  const handleLeagueToggle = async (id: string, field: "isActive" | "is_published", value: boolean) => {
    // Optimistic update
    setLeaguesList((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
    try {
      const res = await fetch("/api/admin/leagues/all", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update league");
    } catch {
      // Rollback on error
      setLeaguesList((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [field]: !value } : l))
      );
      toast.error("Erro ao atualizar liga");
    }
  };

  const handleLeagueDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar a liga "${name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      const res = await fetch(`/api/admin/leagues/delete?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete league");
      setLeaguesList((prev) => prev.filter((l) => l.id !== id));
      toast.success(`Liga "${name}" deletada com sucesso`);
      fetchAll();
    } catch {
      toast.error("Erro ao deletar liga");
    }
  };

  const computeAndSetStats = (
    allOrders: RecentOrder[],
    f: { range: RangeKey; status: StatusKey },
  ) => {
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

    setStats((prev) => ({
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
    }));
  };

  const normalizeStatus = (
    s: string,
  ): StatusKey | "waiting_delivery" | string => {
    if (s === "waiting_delivery") return "waiting_delivery";
    if (s === "completed" || s === "processing" || s === "failed") return s;
    return s;
  };

  const formatCurrency = (amount: number, currency = "BRL") =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(
      amount || 0,
    );

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount || 0);
  };

  const getStatusIcon = (status: string) => {
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
  };

  const getStatusColor = (status: string) => {
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
  };

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

  // Product form handlers
  const generateSlug = (
    name: string,
    gameVersion: string,
    league: string,
    difficulty: string,
  ) => {
    return `${name}-${gameVersion}-${league}-${difficulty}`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await newProduct(productForm);
      setProductForm({
        name: "",
        league: "",
        slug: "",
        category: "",
        description: "",
        price: 0,
        gameVersion: "path-of-exile-1",
        imgUrl: "",
        difficulty: "",
        alt: "",
      });
      toast.success("Product added successfully!");
      fetchAll();
    } catch (error) {
      console.error("Error adding product: ", error);
      toast.error("Failed to add product");
    }
  };

  const handleLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/leagues/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leagueForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add league");
      }

      setLeagueForm({
        name: "",
        imageUrl: "",
        gameVersion: "path-of-exile-1",
        description: "",
        cloneFromLeague: "",
        league_slug: "",
        isActive: true,
        is_published: false,
        difficulty: "softcore",
        poe_ninja_name: "",
      });
      toast.success("League added successfully!");

      // Clone products if requested
      if (leagueForm.cloneFromLeague && leagueForm.cloneFromLeague !== "None") {
        toast.info(`Cloning items from ${leagueForm.cloneFromLeague}...`, {
          duration: 5000,
        });
        try {
          const cloneRes = await fetch("/api/admin/leagues/clone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceLeague: leagueForm.cloneFromLeague,
              targetLeague: leagueForm.name,
            }),
          });
          const cloneData = await cloneRes.json();
          if (cloneRes.ok) {
            toast.success(
              `Successfully cloned ${cloneData.clonedItemsCount} items to ${leagueForm.name}!`,
            );
          } else {
            toast.error(cloneData.error || "Failed to clone items.");
          }
        } catch (cloneErr) {
          console.error("Clone error:", cloneErr);
          toast.error("Network error while cloning items.");
        }
      }

      fetchAll();
    } catch (error) {
      console.error("Error adding league: ", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add league",
      );
    }
  };

  // Product management functions
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
    } finally {
      setProductsLoading(false);
    }
  };

  const filterProducts = (products: Product[]): Product[] => {
    return products.filter((product) => {
      const gameVersionMatch =
        selectedGameVersion === "All Versions" ||
        product.gameVersion === selectedGameVersion;
      const leagueMatch =
        selectedLeague === "All Leagues" || product.league === selectedLeague;
      const difficultyMatch =
        selectedDifficulty === "All Difficulties" ||
        product.difficulty === selectedDifficulty;
      return gameVersionMatch && leagueMatch && difficultyMatch;
    });
  };

  const filteredProducts = filterProducts(products);

  const handleUpdatePrice = async (productId: number) => {
    const price = newPrice;
    if (isNaN(price) || price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    setUpdatingId(productId);
    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, price }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update price");
      }

      setProducts(
        products.map((product) =>
          product.id === productId ? { ...product, price } : product,
        ),
      );
      toast.success("Price updated successfully");
      setNewPrice(0);
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update price",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(
        `/api/admin/products/delete?id=${productId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      setProducts(products.filter((product) => product.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete product",
      );
    }
  };

  const handleClearFilters = () => {
    setSelectedGameVersion("All Versions");
    setSelectedLeague("All Leagues");
    setSelectedDifficulty("All Difficulties");
  };

  const handleToggleStock = async (
    productId: number,
    currentStock: boolean,
  ) => {
    const newStockValue = !currentStock;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, in_stock: newStockValue } : p,
      ),
    );
    try {
      const response = await fetch("/api/admin/products/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, in_stock: newStockValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update stock");
      }
      toast.success(
        `Produto marcado como ${newStockValue ? "Em Estoque" : "Sem Estoque"}`,
      );
    } catch (error) {
      // Revert on failure
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, in_stock: currentStock } : p,
        ),
      );
      toast.error(
        error instanceof Error ? error.message : "Failed to update stock",
      );
    }
  };

  // Bulk products functions

  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split("\n").filter((line) => line.trim());

        // Remove a primeira linha (cabeçalho) se existir
        const dataLines = lines.length > 1 ? lines.slice(1) : lines;

        const products: Product[] = dataLines.map((line, index) => {
          const [
            name,
            category,
            price,
            league,
            difficulty,
            gameVersion,
            description,
            imgUrl,
          ] = line.split(",").map((item) => item.trim());

          return {
            name: name || `Produto ${index + 1}`,
            category: category || "currency",
            price: parseFloat(price) || 0,
            league: league || "Standard",
            difficulty: difficulty || "softcore",
            gameVersion:
              (gameVersion as "path-of-exile-1" | "path-of-exile-2") ||
              "path-of-exile-1",
            description: description || "",
            imgUrl: imgUrl || "",
            slug: generateSlug(
              name || `produto-${index + 1}`,
              gameVersion || "path-of-exile-1",
              league || "Standard",
              difficulty || "softcore",
            ),
            alt: name || `Produto ${index + 1}`,
          };
        });

        setBulkProducts(products);
        toast.success(`${products.length} produtos carregados do arquivo`);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Erro ao processar arquivo. Verifique o formato.");
      }
    };
    reader.readAsText(file);
  };

  const handleBulkCreate = async () => {
    if (bulkProducts.length === 0) {
      toast.error("Nenhum produto para criar");
      return;
    }

    setBulkLoading(true);
    setBulkProgress({ current: 0, total: bulkProducts.length });
    setBulkResults({ success: 0, failed: 0, errors: [] });

    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < bulkProducts.length; i++) {
      try {
        await newProduct(bulkProducts[i]);
        success++;
        setBulkProgress({ current: i + 1, total: bulkProducts.length });
      } catch (error) {
        failed++;
        const errorMsg = `Produto ${i + 1} (${bulkProducts[i].name}): ${error instanceof Error ? error.message : "Erro desconhecido"}`;
        errors.push(errorMsg);
        console.error(`Error creating product ${i + 1}:`, error);
      }
    }

    setBulkResults({ success, failed, errors });
    setBulkLoading(false);

    if (success > 0) {
      toast.success(`${success} produtos criados com sucesso`);
    }
    if (failed > 0) {
      toast.error(`${failed} produtos falharam`);
    }

    // Clear the products list after processing
    setBulkProducts([]);
  };

  const downloadTemplate = () => {
    const template =
      "Nome,Categoria,Preço,Liga,Dificuldade,Versão do Jogo,Descrição,URL da Imagem\n" +
      "Divine Orb,currency,10,Standard,softcore,path-of-exile-1,Moeda divina,https://example.com/divine-orb.png\n" +
      "Exalted Orb,currency,5,Standard,softcore,path-of-exile-1,Moeda exaltada,https://example.com/exalted-orb.png";

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-produtos.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearBulkProducts = () => {
    setBulkProducts([]);
    setBulkResults({ success: 0, failed: 0, errors: [] });
    setBulkProgress({ current: 0, total: 0 });
  };

  // Fetch leagues for product form
  const fetchLeaguesForProduct = async (gameVersion: string) => {
    setLoadingLeagues(true);
    try {
      console.log("Fetching leagues for gameVersion:", gameVersion);

      // Try using the existing getLeagues function first
      try {
        const { getLeagues } = await import("@/app/actions");
        const leagues = await getLeagues(
          gameVersion as "path-of-exile-1" | "path-of-exile-2",
        );
        console.log("Leagues from getLeagues:", leagues);
        setAvailableLeagues(leagues || []);
        return;
      } catch (importError) {
        console.log("getLeagues not available, trying API...");
      }

      // Fallback to API
      const response = await fetch(
        `/api/admin/leagues?gameVersion=${gameVersion}`,
      );
      console.log("Response status:", response.status);

      if (response.ok) {
        const leagues = await response.json();
        console.log("Leagues fetched from API:", leagues);
        setAvailableLeagues(leagues);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
      }
    } catch (error) {
      console.error("Error fetching leagues:", error);
    } finally {
      setLoadingLeagues(false);
    }
  };

  // Fetch leagues for product management filters
  const fetchLeaguesForFilter = async (gameVersion: string) => {
    if (gameVersion === "All Versions") {
      setAvailableLeaguesForFilter([]);
      return;
    }

    setLoadingLeaguesForFilter(true);
    try {
      console.log("Fetching leagues for filter gameVersion:", gameVersion);

      // Try using the existing getLeagues function first
      try {
        const { getLeagues } = await import("@/app/actions");
        const leagues = await getLeagues(
          gameVersion as "path-of-exile-1" | "path-of-exile-2",
        );
        console.log("Leagues for filter from getLeagues:", leagues);
        setAvailableLeaguesForFilter(leagues || []);
        return;
      } catch (importError) {
        console.log("getLeagues not available for filter, trying API...");
      }

      // Fallback to API
      const response = await fetch(
        `/api/admin/leagues?gameVersion=${gameVersion}`,
      );
      console.log("Filter response status:", response.status);

      if (response.ok) {
        const leagues = await response.json();
        console.log("Leagues for filter fetched from API:", leagues);
        setAvailableLeaguesForFilter(leagues);
      } else {
        const errorData = await response.json();
        console.error("Error response for filter:", errorData);
      }
    } catch (error) {
      console.error("Error fetching leagues for filter:", error);
    } finally {
      setLoadingLeaguesForFilter(false);
    }
  };

  // Orders management functions
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

  // Render different views based on activeView
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
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
                    setFilters((s) => ({ ...s, range: value as RangeKey }))
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
                    setFilters((s) => ({ ...s, status: value as StatusKey }))
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

      case "add-product":
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Adicionar Novo Produto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">
                        Nome do Produto
                      </Label>
                      <Input
                        id="name"
                        required
                        value={productForm.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setProductForm({
                            ...productForm,
                            name: newName,
                            slug: generateSlug(
                              newName,
                              productForm.gameVersion,
                              productForm.league,
                              productForm.difficulty,
                            ),
                          });
                        }}
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="Digite o nome do produto"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Liga</Label>
                      <Select
                        value={productForm.league}
                        onValueChange={(value) => {
                          setProductForm({
                            ...productForm,
                            league: value,
                            slug: generateSlug(
                              productForm.name,
                              productForm.gameVersion,
                              value,
                              productForm.difficulty,
                            ),
                          });
                        }}
                        disabled={loadingLeagues}
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue
                            placeholder={
                              loadingLeagues
                                ? "Carregando ligas..."
                                : "Selecione a liga"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {availableLeagues.map((league) => (
                            <SelectItem key={league.id} value={league.name}>
                              {league.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slug" className="text-foreground">
                        Slug
                      </Label>
                      <Input
                        id="slug"
                        required
                        value={productForm.slug}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            slug: e.target.value,
                          })
                        }
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="Slug gerado automaticamente"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-foreground">
                        Preço
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          $
                        </span>
                        <Input
                          id="price"
                          type="number"
                          required
                          value={productForm.price}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              price: Number(e.target.value),
                            })
                          }
                          className="bg-card border-border text-card-foreground focus:border-primary pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imgUrl" className="text-foreground">
                        URL da Imagem
                      </Label>
                      <Input
                        id="imgUrl"
                        required
                        value={productForm.imgUrl}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            imgUrl: e.target.value,
                          })
                        }
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="Digite a URL da imagem"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Versão do Jogo</Label>
                      <Select
                        value={
                          productForm.gameVersion as
                            | "path-of-exile-1"
                            | "path-of-exile-2"
                        }
                        onValueChange={(
                          value: "path-of-exile-1" | "path-of-exile-2",
                        ) => {
                          setProductForm({
                            ...productForm,
                            gameVersion: value,
                            slug: generateSlug(
                              productForm.name,
                              value,
                              productForm.league,
                              productForm.difficulty,
                            ),
                          });
                        }}
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder="Selecione a versão do jogo" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="path-of-exile-1">
                            Path of Exile 1
                          </SelectItem>
                          <SelectItem value="path-of-exile-2">
                            Path of Exile 2
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Categoria</Label>
                      <Select
                        value={productForm.category}
                        onValueChange={(value) =>
                          setProductForm({ ...productForm, category: value })
                        }
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="services">Services</SelectItem>
                          <SelectItem value="items">Items</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Dificuldade</Label>
                      <Select
                        value={productForm.difficulty}
                        onValueChange={(value) => {
                          setProductForm({
                            ...productForm,
                            difficulty: value,
                            slug: generateSlug(
                              productForm.name,
                              productForm.gameVersion,
                              productForm.league,
                              value,
                            ),
                          });
                        }}
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder="Selecione a dificuldade" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="softcore">Softcore</SelectItem>
                          <SelectItem value="hardcore">Hardcore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="alt" className="text-foreground">
                        Alt da Imagem
                      </Label>
                      <Textarea
                        id="alt"
                        value={productForm.alt}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setProductForm({
                            ...productForm,
                            alt: e.target.value,
                          })
                        }
                        className="w-full bg-card border border-border text-card-foreground focus:border-primary min-h-[100px] resize-y rounded-md p-2"
                        placeholder="Digite o alt da imagem"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-md min-w-[200px]"
                    >
                      Salvar Produto
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      case "bulk-products":
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Criar Produtos em Massa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">
                      Como usar:
                    </h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>
                        Baixe o template CSV clicando em "Baixar Template"
                      </li>
                      <li>Preencha o arquivo com os dados dos produtos</li>
                      <li>
                        Faça upload do arquivo usando o botão "Selecionar
                        Arquivo"
                      </li>
                      <li>Revise os produtos carregados</li>
                      <li>Clique em "Criar Produtos" para processar</li>
                    </ol>
                  </div>

                  {/* Template Download */}
                  <div className="flex gap-3">
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Template
                    </Button>
                    <Button
                      onClick={() =>
                        document.getElementById("bulk-file-input")?.click()
                      }
                      variant="outline"
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Selecionar Arquivo
                    </Button>
                    <input
                      id="bulk-file-input"
                      type="file"
                      accept=".csv"
                      onChange={handleBulkFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Progress */}
                  {bulkLoading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processando produtos...</span>
                        <span>
                          {bulkProgress.current} / {bulkProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(bulkProgress.current / bulkProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {bulkResults.success > 0 || bulkResults.failed > 0 ? (
                    <div className="space-y-2">
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">
                          ✓ {bulkResults.success} sucessos
                        </span>
                        <span className="text-red-600">
                          ✗ {bulkResults.failed} falhas
                        </span>
                      </div>
                      {bulkResults.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <h4 className="font-semibold text-red-800 mb-2">
                            Erros:
                          </h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {bulkResults.errors
                              .slice(0, 5)
                              .map((error, index) => (
                                <li key={index}>• {error}</li>
                              ))}
                            {bulkResults.errors.length > 5 && (
                              <li>
                                ... e mais {bulkResults.errors.length - 5} erros
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Products List */}
                  {bulkProducts.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-foreground">
                          Produtos Carregados ({bulkProducts.length})
                        </h3>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleBulkCreate}
                            disabled={bulkLoading}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            {bulkLoading ? "Criando..." : "Criar Produtos"}
                          </Button>
                          <Button
                            onClick={clearBulkProducts}
                            variant="outline"
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Limpar
                          </Button>
                        </div>
                      </div>

                      <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <div className="grid grid-cols-1 gap-2 p-4">
                          {bulkProducts.map((product, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded border"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-foreground">
                                  {product.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {product.category} • ${product.price} •{" "}
                                  {product.league} • {product.difficulty}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {product.gameVersion === "path-of-exile-1"
                                  ? "POE 1"
                                  : "POE 2"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "add-league":
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Adicionar Nova Liga
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeagueSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">
                        Nome da Liga
                      </Label>
                      <Input
                        id="name"
                        required
                        value={leagueForm.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const autoSlug = name
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, "-")
                            .replace(/[^a-z0-9-]/g, "");
                          setLeagueForm({
                            ...leagueForm,
                            name,
                            league_slug: autoSlug,
                          });
                        }}
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="ex: Settlers of Kalguur"
                      />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <Label htmlFor="league_slug" className="text-foreground">
                        Slug da Liga
                      </Label>
                      <Input
                        id="league_slug"
                        required
                        value={leagueForm.league_slug}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            league_slug: e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, ""),
                          })
                        }
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="ex: settlers-of-kalguur"
                      />
                      <p className="text-xs text-muted-foreground">
                        Gerado automaticamente a partir do nome. Usado nas URLs de builds.
                      </p>
                    </div>

                    {/* Versão do Jogo */}
                    <div className="space-y-2">
                      <Label className="text-foreground">Versão do Jogo</Label>
                      <Select
                        value={leagueForm.gameVersion}
                        onValueChange={(
                          value: "path-of-exile-1" | "path-of-exile-2",
                        ) =>
                          setLeagueForm({ ...leagueForm, gameVersion: value })
                        }
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder="Selecione a versão do jogo" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="path-of-exile-1">
                            Path of Exile 1
                          </SelectItem>
                          <SelectItem value="path-of-exile-2">
                            Path of Exile 2
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-2">
                      <Label className="text-foreground">Dificuldade</Label>
                      <Select
                        value={leagueForm.difficulty}
                        onValueChange={(value) =>
                          setLeagueForm({ ...leagueForm, difficulty: value })
                        }
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder="Selecione a dificuldade" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="softcore">Softcore</SelectItem>
                          <SelectItem value="hardcore">Hardcore</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* URL da Imagem */}
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-foreground">
                        URL da Imagem
                      </Label>
                      <Input
                        id="imageUrl"
                        required
                        value={leagueForm.imageUrl}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            imageUrl: e.target.value,
                          })
                        }
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="https://..."
                      />
                    </div>

                    {/* poe.ninja name */}
                    <div className="space-y-2">
                      <Label htmlFor="poe_ninja_name" className="text-foreground">
                        Nome no poe.ninja
                      </Label>
                      <Input
                        id="poe_ninja_name"
                        value={leagueForm.poe_ninja_name}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            poe_ninja_name: e.target.value,
                          })
                        }
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="ex: Settlers"
                      />
                      <p className="text-xs text-muted-foreground">
                        Nome exato usado pela API do poe.ninja para buscar preços.
                      </p>
                    </div>

                    {/* Clone de liga */}
                    <div className="space-y-2">
                      <Label className="text-foreground">
                        Clonar itens de uma liga existente (Opcional)
                      </Label>
                      <Select
                        value={leagueForm.cloneFromLeague}
                        onValueChange={(value) =>
                          setLeagueForm({
                            ...leagueForm,
                            cloneFromLeague: value,
                          })
                        }
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder="Selecione uma liga (ou deixe vazio)" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="None">
                            Não clonar (Liga vazia)
                          </SelectItem>
                          {availableLeaguesForFilter.map((l) => (
                            <SelectItem key={l.id} value={l.name}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ao clonar, todos os itens da liga de origem serão
                        copiados para esta nova liga com o preço zerado e
                        pausados.
                      </p>
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description" className="text-foreground">
                        Descrição
                      </Label>
                      <Textarea
                        id="description"
                        value={leagueForm.description}
                        onChange={(e) =>
                          setLeagueForm({
                            ...leagueForm,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-card border border-border text-card-foreground focus:border-primary min-h-[100px] resize-y rounded-md p-2"
                        placeholder="Descrição da liga (opcional)"
                      />
                    </div>

                    {/* Toggles: isActive + is_published */}
                    <div className="md:col-span-2 flex flex-wrap gap-8">
                      <div className="flex items-center gap-3">
                        <Switch
                          id="isActive"
                          checked={leagueForm.isActive}
                          onCheckedChange={(checked) =>
                            setLeagueForm({ ...leagueForm, isActive: checked })
                          }
                        />
                        <div>
                          <Label htmlFor="isActive" className="text-foreground font-medium cursor-pointer">
                            Liga Ativa
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Liga aparece nos filtros de produtos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          id="is_published"
                          checked={leagueForm.is_published}
                          onCheckedChange={(checked) =>
                            setLeagueForm({ ...leagueForm, is_published: checked })
                          }
                        />
                        <div>
                          <Label htmlFor="is_published" className="text-foreground font-medium cursor-pointer">
                            Publicada
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Liga visível publicamente no site
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-8 rounded-md min-w-[200px]"
                    >
                      Salvar Liga
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        );

      case "manage-products":
        if (productsLoading) {
          return (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Gerenciar Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Filtros */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      value={selectedGameVersion}
                      onValueChange={setSelectedGameVersion}
                    >
                      <SelectTrigger className="bg-card border-border text-card-foreground">
                        <SelectValue placeholder="Versão do Jogo" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="All Versions">
                          Todas as Versões
                        </SelectItem>
                        <SelectItem value="path-of-exile-1">
                          Path of Exile 1
                        </SelectItem>
                        <SelectItem value="path-of-exile-2">
                          Path of Exile 2
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedLeague}
                      onValueChange={setSelectedLeague}
                      disabled={loadingLeaguesForFilter}
                    >
                      <SelectTrigger className="bg-card border-border text-card-foreground">
                        <SelectValue
                          placeholder={
                            loadingLeaguesForFilter
                              ? "Carregando ligas..."
                              : "Liga"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="All Leagues">
                          Todas as Ligas
                        </SelectItem>
                        {availableLeaguesForFilter.map((league) => (
                          <SelectItem key={league.id} value={league.name}>
                            {league.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedDifficulty}
                      onValueChange={setSelectedDifficulty}
                    >
                      <SelectTrigger className="bg-card border-border text-card-foreground">
                        <SelectValue placeholder="Dificuldade" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="All Difficulties">
                          Todas as Dificuldades
                        </SelectItem>
                        <SelectItem value="softcore">Softcore</SelectItem>
                        <SelectItem value="hardcore">Hardcore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleClearFilters}
                      variant="outline"
                      className="border-border text-foreground hover:bg-accent"
                    >
                      Limpar Filtros
                    </Button>
                  </div>

                  {/* Lista de produtos */}
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="p-4 border border-border rounded-lg bg-muted/20"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-card-foreground">
                                {product.name}
                              </h3>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  product.in_stock !== false
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-red-500/10 text-red-400 border-red-500/30"
                                }`}
                              >
                                {product.in_stock !== false
                                  ? "Em Estoque"
                                  : "Sem Estoque"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Preço atual: ${product.price} | {product.league} |{" "}
                              {product.difficulty}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Stock toggle */}
                            <Button
                              onClick={() =>
                                product.id &&
                                handleToggleStock(
                                  product.id,
                                  product.in_stock !== false,
                                )
                              }
                              size="sm"
                              className={
                                product.in_stock !== false
                                  ? "bg-red-700 hover:bg-red-800 text-white font-semibold"
                                  : "bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                              }
                            >
                              {product.in_stock !== false
                                ? "Tirar do Estoque"
                                : "Colocar em Estoque"}
                            </Button>

                            {/* Price update */}
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  type="number"
                                  placeholder="Novo preço"
                                  value={newPrice}
                                  onChange={(e) =>
                                    setNewPrice(Number(e.target.value))
                                  }
                                  className="w-24 pl-7 bg-card border-border text-card-foreground focus:border-primary"
                                />
                              </div>
                              <Button
                                onClick={() =>
                                  product.id && handleUpdatePrice(product.id)
                                }
                                disabled={updatingId === product.id}
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                {updatingId === product.id
                                  ? "Atualizando..."
                                  : "Atualizar"}
                              </Button>
                            </div>

                            <Button
                              onClick={() =>
                                product.id && handleDeleteProduct(product.id)
                              }
                              size="sm"
                              variant="destructive"
                            >
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredProducts.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">
                          Nenhum produto encontrado
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "manage-leagues": {
        if (!leaguesListLoading && leaguesList.length === 0) {
          fetchLeagues();
        }

        const filteredLeagues =
          leaguesGameVersionFilter === "all"
            ? leaguesList
            : leaguesList.filter((l) => l.gameVersion === leaguesGameVersionFilter);

        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-card-foreground">
                    Gerenciar Ligas
                    {leaguesList.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({filteredLeagues.length} de {leaguesList.length})
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select
                      value={leaguesGameVersionFilter}
                      onValueChange={(v) => setLeaguesGameVersionFilter(v as "all" | "path-of-exile-1" | "path-of-exile-2")}
                    >
                      <SelectTrigger className="w-44 bg-card border-border text-card-foreground text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="all">Todas as versões</SelectItem>
                        <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
                        <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchLeagues}
                      disabled={leaguesListLoading}
                      className="border-border text-foreground hover:bg-accent"
                    >
                      {leaguesListLoading ? "Carregando..." : "Atualizar"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {leaguesListLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredLeagues.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma liga encontrada.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredLeagues.map((league) => (
                      <div
                        key={league.id}
                        className="p-4 border border-border rounded-lg bg-muted/20 flex flex-col gap-3"
                      >
                        {/* Header da liga */}
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-card-foreground truncate">
                                {league.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={
                                  league.gameVersion === "path-of-exile-2"
                                    ? "border-blue-500/40 text-blue-400 text-[10px]"
                                    : "border-amber-500/40 text-amber-400 text-[10px]"
                                }
                              >
                                {league.gameVersion === "path-of-exile-2" ? "PoE 2" : "PoE 1"}
                              </Badge>
                              {league.difficulty && (
                                <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                                  {league.difficulty}
                                </Badge>
                              )}
                            </div>
                            {/* Metadados */}
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              {league.league_slug && (
                                <span>
                                  <span className="text-foreground/50">slug:</span>{" "}
                                  <code className="text-[11px] bg-muted px-1 rounded">{league.league_slug}</code>
                                </span>
                              )}
                              {league.poe_ninja_name && (
                                <span>
                                  <span className="text-foreground/50">poe.ninja:</span>{" "}
                                  {league.poe_ninja_name}
                                </span>
                              )}
                              {league.updated_at && (
                                <span>
                                  <span className="text-foreground/50">atualizada:</span>{" "}
                                  {new Date(league.updated_at).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botão deletar */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLeagueDelete(league.id, league.name)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                          >
                            Deletar
                          </Button>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-wrap gap-6 pt-1 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`active-${league.id}`}
                              checked={league.isActive}
                              onCheckedChange={(v) => handleLeagueToggle(league.id, "isActive", v)}
                            />
                            <Label htmlFor={`active-${league.id}`} className="text-sm text-muted-foreground cursor-pointer">
                              Liga ativa
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`published-${league.id}`}
                              checked={league.is_published}
                              onCheckedChange={(v) => handleLeagueToggle(league.id, "is_published", v)}
                            />
                            <Label htmlFor={`published-${league.id}`} className="text-sm text-muted-foreground cursor-pointer">
                              Publicada
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      }

      case "orders":
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

      case "cache":
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">
                  Gerenciar Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    Use os botões abaixo para limpar o cache de diferentes tipos
                    de conteúdo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <RevalidateCacheButton
                      type="post"
                      label="Limpar Cache do Blog"
                      variant="outline"
                    />
                    <RevalidateCacheButton
                      type="product"
                      label="Limpar Cache de Produtos"
                      variant="outline"
                    />
                    <RevalidateCacheButton
                      type="author"
                      label="Limpar Cache de Autores"
                      variant="outline"
                    />
                    <RevalidateCacheButton
                      type="category"
                      label="Limpar Cache de Categorias"
                      variant="outline"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

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

// ─── ManageBuildsView ───────────────────────────────────────────────────────

function ManageBuildsView({ onAddBuild }: { onAddBuild: () => void }) {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [buildToDelete, setBuildToDelete] = useState<Build | null>(null);
  const [filterVersion, setFilterVersion] = useState("all");
  const [editingBuild, setEditingBuild] = useState<Build | null>(null);

  useEffect(() => {
    fetchBuilds();
  }, []);

  async function fetchBuilds() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/builds");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBuilds(data);
    } catch {
      toast.error("Erro ao carregar builds");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublished(build: Build) {
    try {
      const res = await fetch(`/api/admin/builds/${build.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: !build.is_published }),
      });
      if (!res.ok) throw new Error();
      setBuilds((prev) =>
        prev.map((b) =>
          b.id === build.id ? { ...b, is_published: !b.is_published } : b,
        ),
      );
      toast.success(
        build.is_published ? "Build despublicada" : "Build publicada",
      );
    } catch {
      toast.error("Erro ao atualizar build");
    }
  }

  function confirmDelete(build: Build) {
    setBuildToDelete(build);
    setConfirmOpen(true);
  }

  async function handleDelete() {
    if (!buildToDelete) return;
    setDeletingId(buildToDelete.id);
    try {
      const res = await fetch(`/api/admin/builds/${buildToDelete.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setBuilds((prev) => prev.filter((b) => b.id !== buildToDelete.id));
      toast.success("Build excluída");
    } catch {
      toast.error("Erro ao excluir build");
    } finally {
      setDeletingId(null);
      setBuildToDelete(null);
    }
  }

  const filtered =
    filterVersion === "all"
      ? builds
      : builds.filter((b) => b.game_version === filterVersion);

  if (editingBuild) {
    return (
      <AddBuildView
        key={editingBuild.id}
        initialData={editingBuild}
        onSuccess={() => {
          setEditingBuild(null);
          fetchBuilds();
        }}
        onCancel={() => setEditingBuild(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            Builds ({filtered.length})
          </h2>
          <Select value={filterVersion} onValueChange={setFilterVersion}>
            <SelectTrigger className="w-44 h-8 text-sm border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os jogos</SelectItem>
              <SelectItem value="path-of-exile-1">PoE 1</SelectItem>
              <SelectItem value="path-of-exile-2">PoE 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={onAddBuild}>
          <Plus className="h-4 w-4 mr-1" /> Nova Build
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma build encontrada.{" "}
            <button onClick={onAddBuild} className="text-primary underline">
              Criar a primeira
            </button>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((build) => (
            <Card key={build.id} className="bg-card border-border">
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden border border-border/50">
                    <AscendancyImage
                      ascendancy={build.ascendancy}
                      imageUrl={build.image_url}
                      gameVersion={build.game_version}
                      variant="icon"
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {build.title}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${build.is_published ? "text-green-400 border-green-500/40" : "text-gray-400 border-gray-600/40"}`}
                      >
                        {build.is_published ? "Publicada" : "Rascunho"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {build.class} · {build.ascendancy}
                      {build.league && ` · ${build.league}`}
                      {build.tags.length > 0 && ` · ${build.tags.join(", ")}`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingBuild(build)}
                      title="Editar"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublished(build)}
                      title={build.is_published ? "Despublicar" : "Publicar"}
                      className="h-8 w-8 p-0"
                    >
                      {build.is_published ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => confirmDelete(build)}
                      disabled={deletingId === build.id}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
        title="Excluir Build"
        description={`Tem certeza que deseja excluir "${buildToDelete?.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}

// ─── AddBuildView ───────────────────────────────────────────────────────────

function AddBuildView({
  onSuccess,
  onCancel,
  initialData,
}: {
  onSuccess: () => void;
  onCancel?: () => void;
  initialData?: Build | null;
}) {
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);
  const [availableLeagues, setAvailableLeagues] = useState<{ name: string }[]>(
    [],
  );
  const [loadingLeagues, setLoadingLeagues] = useState(false);
  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    game_version: initialData?.game_version ?? "path-of-exile-1",
    league: initialData?.league ?? "",
    class: initialData?.class ?? "",
    ascendancy: initialData?.ascendancy ?? "",
    main_skill: initialData?.main_skill ?? "",
    description: initialData?.description ?? "",
    pob_code: initialData?.pob_code ?? "",
    tags: initialData?.tags ?? ([] as string[]),
    difficulty: initialData?.difficulty ?? "",
    budget: initialData?.budget ?? "",
    image_url: initialData?.image_url ?? "",
    video_url: initialData?.video_url ?? "",
    guide_content: initialData?.guide_content ?? "",
    seo_title: initialData?.seo_title ?? "",
    seo_description: initialData?.seo_description ?? "",
    author: initialData?.author ?? "",
    is_published: initialData?.is_published ?? false,
  });

  // Re-sync form when switching between different builds to edit
  useEffect(() => {
    setForm({
      title: initialData?.title ?? "",
      slug: initialData?.slug ?? "",
      game_version: initialData?.game_version ?? "path-of-exile-1",
      league: initialData?.league ?? "",
      class: initialData?.class ?? "",
      ascendancy: initialData?.ascendancy ?? "",
      main_skill: initialData?.main_skill ?? "",
      description: initialData?.description ?? "",
      pob_code: initialData?.pob_code ?? "",
      tags: initialData?.tags ?? [],
      difficulty: initialData?.difficulty ?? "",
      budget: initialData?.budget ?? "",
      image_url: initialData?.image_url ?? "",
      video_url: initialData?.video_url ?? "",
      guide_content: initialData?.guide_content ?? "",
      seo_title: initialData?.seo_title ?? "",
      seo_description: initialData?.seo_description ?? "",
      author: initialData?.author ?? "",
      is_published: initialData?.is_published ?? false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  // Fetch active leagues whenever game_version changes
  useEffect(() => {
    async function fetchLeagues() {
      setLoadingLeagues(true);
      try {
        const res = await fetch(
          `/api/admin/leagues?gameVersion=${form.game_version}`,
        );
        if (res.ok) {
          const data = await res.json();
          setAvailableLeagues(data || []);
        }
      } catch {
        // silently ignore — league field remains a free input if API fails
      } finally {
        setLoadingLeagues(false);
      }
    }
    fetchLeagues();
  }, [form.game_version]);

  const classes = getClassesForGameVersion(form.game_version);
  const selectedClass = classes.find((c) => c.name === form.class);
  const ascendancies = selectedClass?.ascendancies ?? [];

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function toggleTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.title ||
      !form.slug ||
      !form.pob_code ||
      !form.class ||
      !form.ascendancy
    ) {
      toast.error(
        "Preencha os campos obrigatórios: título, slug, classe, ascendência e código PoB",
      );
      return;
    }
    setLoading(true);
    try {
      const url = isEditing
        ? `/api/admin/builds/${initialData!.id}`
        : "/api/admin/builds";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          err.error ||
            (isEditing ? "Erro ao salvar build" : "Erro ao criar build"),
        );
      }
      toast.success(
        isEditing ? "Build atualizada!" : "Build criada com sucesso!",
      );
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {isEditing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            type="button"
            onClick={onCancel}
            className="hover:text-foreground transition-colors"
          >
            ← Voltar para lista
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">
            Editando: {initialData!.title}
          </span>
        </div>
      )}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (!form.slug) set("slug", autoSlug(e.target.value));
                }}
                placeholder="Ex: Hexblast Mines Saboteur"
                className="border-border"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug *</Label>
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="hexblast-mines-saboteur"
                className="border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Descrição curta</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              placeholder="Resumo de 1-2 linhas..."
              className="border-border"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Classificação PoE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Versão do Jogo *</Label>
              <Select
                value={form.game_version}
                onValueChange={(v) => {
                  set("game_version", v);
                  set("class", "");
                  set("ascendancy", "");
                }}
              >
                <SelectTrigger className="border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="path-of-exile-1">
                    Path of Exile 1
                  </SelectItem>
                  <SelectItem value="path-of-exile-2">
                    Path of Exile 2
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Liga</Label>
              <Select
                value={form.league || undefined}
                onValueChange={(v) => set("league", v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="border-border">
                  <SelectValue
                    placeholder={
                      loadingLeagues
                        ? "Carregando ligas..."
                        : "Selecione a liga"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {form.league && (
                    <SelectItem value="__none__">— Remover —</SelectItem>
                  )}
                  {availableLeagues.map((l) => (
                    <SelectItem key={l.name} value={l.name}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Classe *</Label>
              <Select
                value={form.class || undefined}
                onValueChange={(v) => {
                  set("class", v);
                  set("ascendancy", "");
                }}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ascendência *</Label>
              <Select
                value={form.ascendancy || undefined}
                onValueChange={(v) => set("ascendancy", v)}
                disabled={ascendancies.length === 0}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ascendancies.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Skill Principal</Label>
              <Input
                value={form.main_skill}
                onChange={(e) => set("main_skill", e.target.value)}
                placeholder="Ex: Hexblast"
                className="border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dificuldade</Label>
              <Select
                value={form.difficulty || undefined}
                onValueChange={(v) =>
                  set("difficulty", v === "__clear__" ? "" : v)
                }
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {form.difficulty && (
                    <SelectItem
                      value="__clear__"
                      className="text-muted-foreground"
                    >
                      — Remover —
                    </SelectItem>
                  )}
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budget</Label>
              <Select
                value={form.budget || undefined}
                onValueChange={(v) => set("budget", v === "__clear__" ? "" : v)}
              >
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {form.budget && (
                    <SelectItem
                      value="__clear__"
                      className="text-muted-foreground"
                    >
                      — Remover —
                    </SelectItem>
                  )}
                  <SelectItem value="cheap">Barato</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="expensive">Caro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {BUILD_TAGS.map((tag) => (
                <label
                  key={tag.value}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Checkbox
                    checked={form.tags.includes(tag.value)}
                    onCheckedChange={() => toggleTag(tag.value)}
                  />
                  <span className="text-sm text-foreground/80">
                    {tag.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Path of Building
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label>
              Código PoB *{" "}
              <span className="text-xs text-muted-foreground">
                (base64 do Path of Building)
              </span>
            </Label>
            <Textarea
              value={form.pob_code}
              onChange={(e) => set("pob_code", e.target.value)}
              rows={4}
              placeholder="Cole o código PoB aqui..."
              className="border-border font-mono text-xs"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Mídia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              URL da Imagem{" "}
              <span className="text-xs text-muted-foreground">
                (opcional — fallback: CDN poecdn.com)
              </span>
            </Label>
            <Input
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://..."
              className="border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>URL do Vídeo (YouTube)</Label>
            <Input
              value={form.video_url}
              onChange={(e) => set("video_url", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="border-border"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            Guia (Markdown)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.guide_content}
            onChange={(e) => set("guide_content", e.target.value)}
            rows={8}
            placeholder="# Guia da Build&#10;&#10;## Mecânica principal..."
            className="border-border font-mono text-xs"
          />
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground text-base">
            SEO & Publicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>SEO Title</Label>
            <Input
              value={form.seo_title}
              onChange={(e) => set("seo_title", e.target.value)}
              placeholder="Deixe vazio para usar o título"
              className="border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>SEO Description</Label>
            <Textarea
              value={form.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
              rows={2}
              className="border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Autor</Label>
            <Input
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              className="border-border"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_published"
              checked={form.is_published}
              onCheckedChange={(v) => set("is_published", !!v)}
            />
            <Label htmlFor="is_published">Publicar imediatamente</Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Salvando..."
            : isEditing
              ? "Salvar Alterações"
              : "Criar Build"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel ?? onSuccess}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
