'use client';

import { useState, useEffect, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import RevalidateCacheButton from '@/components/revalidate-cache-button';
import { toast } from 'sonner';
import { newProduct } from '@/app/actions';
import { getProducts } from '@/app/actions';
import type { Product } from '@/lib/interface';
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
  Trash2
} from 'lucide-react';

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
  status: 'completed' | 'processing' | 'waiting_delivery' | 'failed' | string;
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

type RangeKey = '24h' | '7d' | '30d' | 'all';
type StatusKey = 'all' | 'completed' | 'processing' | 'waiting_delivery' | 'failed';

interface DashboardViewsProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function DashboardViews({ activeView, onViewChange }: DashboardViewsProps) {
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
    last24hOrders: 0
  });

  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<{ range: RangeKey; status: StatusKey }>({
    range: '7d',
    status: 'all'
  });

  // Product management states
  const [productsLoading, setProductsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [selectedGameVersion, setSelectedGameVersion] = useState<string>("All Versions");
  const [selectedLeague, setSelectedLeague] = useState<string>("All Leagues");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All Difficulties");

  // Leagues for product management filters
  const [availableLeaguesForFilter, setAvailableLeaguesForFilter] = useState<Array<{ id: string, name: string, gameVersion: string }>>([]);
  const [loadingLeaguesForFilter, setLoadingLeaguesForFilter] = useState(false);

  // Orders management states
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<('processing' | 'waiting_delivery' | 'completed' | 'failed')[]>(['processing', 'waiting_delivery', 'completed', 'failed']);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToMove, setOrderToMove] = useState<{ orderId: string; newStatus: 'processing' | 'waiting_delivery' | 'completed' | 'failed'; orderNumber: string; direction: 'next' | 'prev' } | null>(null);

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

  const [leagueForm, setLeagueForm] = useState({
    name: "",
    imageUrl: "",
    gameVersion: "path-of-exile-1" as "path-of-exile-1" | "path-of-exile-2",
    description: "",
  });

  // Leagues state for product form
  const [availableLeagues, setAvailableLeagues] = useState<Array<{ id: string, name: string, gameVersion: string }>>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  // Bulk products states
  const [bulkProducts, setBulkProducts] = useState<Product[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkResults, setBulkResults] = useState<{ success: number, failed: number, errors: string[] }>({ success: 0, failed: 0, errors: [] });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAll())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load products when manage-products view is active
  useEffect(() => {
    if (activeView === 'manage-products' && products.length === 0) {
      fetchProducts();
    }
  }, [activeView]);

  // Load orders when orders view is active
  useEffect(() => {
    if (activeView === 'orders' && orders.length === 0) {
      fetchOrdersForManagement();
    }
  }, [activeView]);

  // Load leagues when game version changes in product form
  useEffect(() => {
    if (activeView === 'add-product' && productForm.gameVersion) {
      fetchLeaguesForProduct(productForm.gameVersion);
    }
  }, [productForm.gameVersion, activeView]);

  // Load leagues when game version changes in product management filters
  useEffect(() => {
    if (activeView === 'manage-products' && selectedGameVersion) {
      fetchLeaguesForFilter(selectedGameVersion);
    }
  }, [selectedGameVersion, activeView]);

  useEffect(() => {
    computeAndSetStats(orders, filters);
  }, [filters, orders]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [{ count: productsCount }, { count: leaguesCount }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('leagues').select('*', { count: 'exact', head: true })
      ]);

      const response = await fetch('/api/admin/orders', { cache: 'no-store' });
      const allOrders: RecentOrder[] = await response.json();

      allOrders.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setOrders(allOrders);
      setRecentOrders(allOrders.slice(0, 5));
      setStats((prev) => ({
        ...prev,
        totalProducts: productsCount || 0,
        totalLeagues: leaguesCount || 0
      }));
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Erro ao buscar dados do dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const computeAndSetStats = (allOrders: RecentOrder[], f: { range: RangeKey; status: StatusKey }) => {
    const now = Date.now();
    const rangeMsMap: Record<RangeKey, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      all: Number.POSITIVE_INFINITY
    };

    const rangeMs = rangeMsMap[f.range];
    const inRange = allOrders.filter((o) => now - new Date(o.created_at).getTime() <= rangeMs);
    const statusFiltered =
      f.status === 'all' ? inRange : inRange.filter((o) => normalizeStatus(o.status) === f.status);

    const completed = statusFiltered.filter((o) => normalizeStatus(o.status) === 'completed');
    const processing = statusFiltered.filter((o) => normalizeStatus(o.status) === 'processing');
    const waitingDelivery = statusFiltered.filter((o) => normalizeStatus(o.status) === 'waiting_delivery');
    const failed = statusFiltered.filter((o) => normalizeStatus(o.status) === 'failed');

    const revenue = completed.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
    const totalOrders = statusFiltered.length;
    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
    const completionRate = totalOrders > 0 ? completed.length / totalOrders : 0;

    const last24h = allOrders.filter(
      (o) => now - new Date(o.created_at).getTime() <= 24 * 60 * 60 * 1000
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
      last24hOrders: last24h
    }));
  };

  const normalizeStatus = (s: string): StatusKey | 'waiting_delivery' | string => {
    if (s === 'waiting_delivery') return 'waiting_delivery';
    if (s === 'completed' || s === 'processing' || s === 'failed') return s;
    return s;
  };

  const formatCurrency = (amount: number, currency = 'BRL') =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount || 0);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount || 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'waiting_delivery':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'waiting_delivery':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const pct = useMemo(() => {
    const total = stats.completedOrders + stats.processingOrders + stats.waitingDeliveryOrders + stats.failedOrders || 1;
    return {
      completed: Math.round((stats.completedOrders / total) * 100),
      processing: Math.round((stats.processingOrders / total) * 100),
      waitingDelivery: Math.round((stats.waitingDeliveryOrders / total) * 100),
      failed: Math.round((stats.failedOrders / total) * 100)
    };
  }, [stats.completedOrders, stats.processingOrders, stats.waitingDeliveryOrders, stats.failedOrders]);

  // Product form handlers
  const generateSlug = (name: string, gameVersion: string, league: string, difficulty: string) => {
    return `${name}-${gameVersion}-${league}-${difficulty}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
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
      toast.success('Product added successfully!');
      fetchAll();
    } catch (error) {
      console.error("Error adding product: ", error);
      toast.error('Failed to add product');
    }
  };

  const handleLeagueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/leagues/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leagueForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add league');
      }

      setLeagueForm({
        name: "",
        imageUrl: "",
        gameVersion: "path-of-exile-1",
        description: "",
      });
      toast.success("League added successfully!");
      fetchAll();
    } catch (error) {
      console.error("Error adding league: ", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add league"
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
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  const filterProducts = (products: Product[]): Product[] => {
    return products.filter(product => {
      const gameVersionMatch = selectedGameVersion === "All Versions" || product.gameVersion === selectedGameVersion;
      const leagueMatch = selectedLeague === "All Leagues" || product.league === selectedLeague;
      const difficultyMatch = selectedDifficulty === "All Difficulties" || product.difficulty === selectedDifficulty;
      return gameVersionMatch && leagueMatch && difficultyMatch;
    });
  };

  const filteredProducts = filterProducts(products);

  const handleUpdatePrice = async (productId: number) => {
    const price = newPrice;
    if (isNaN(price) || price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    setUpdatingId(productId);
    try {
      const response = await fetch('/api/admin/products/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, price }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update price');
      }

      setProducts(products.map(product =>
        product.id === productId ? { ...product, price } : product
      ));
      toast.success('Price updated successfully');
      setNewPrice(0);
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update price');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/admin/products/delete?id=${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      setProducts(products.filter(product => product.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  const handleClearFilters = () => {
    setSelectedGameVersion("All Versions");
    setSelectedLeague("All Leagues");
    setSelectedDifficulty("All Difficulties");
  };

  const handleToggleStock = async (productId: number, currentStock: boolean) => {
    const newStockValue = !currentStock;
    // Optimistic update
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, in_stock: newStockValue } : p
    ));
    try {
      const response = await fetch('/api/admin/products/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, in_stock: newStockValue }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update stock');
      }
      toast.success(`Produto marcado como ${newStockValue ? 'Em Estoque' : 'Sem Estoque'}`);
    } catch (error) {
      // Revert on failure
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, in_stock: currentStock } : p
      ));
      toast.error(error instanceof Error ? error.message : 'Failed to update stock');
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
        const lines = content.split('\n').filter(line => line.trim());

        // Remove a primeira linha (cabeçalho) se existir
        const dataLines = lines.length > 1 ? lines.slice(1) : lines;

        const products: Product[] = dataLines.map((line, index) => {
          const [name, category, price, league, difficulty, gameVersion, description, imgUrl] = line.split(',').map(item => item.trim());

          return {
            name: name || `Produto ${index + 1}`,
            category: category || 'currency',
            price: parseFloat(price) || 0,
            league: league || 'Standard',
            difficulty: difficulty || 'softcore',
            gameVersion: (gameVersion as 'path-of-exile-1' | 'path-of-exile-2') || 'path-of-exile-1',
            description: description || '',
            imgUrl: imgUrl || '',
            slug: generateSlug(name || `produto-${index + 1}`, gameVersion || 'path-of-exile-1', league || 'Standard', difficulty || 'softcore'),
            alt: name || `Produto ${index + 1}`
          };
        });

        setBulkProducts(products);
        toast.success(`${products.length} produtos carregados do arquivo`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Erro ao processar arquivo. Verifique o formato.');
      }
    };
    reader.readAsText(file);
  };

  const handleBulkCreate = async () => {
    if (bulkProducts.length === 0) {
      toast.error('Nenhum produto para criar');
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
        const errorMsg = `Produto ${i + 1} (${bulkProducts[i].name}): ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
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
    const template = 'Nome,Categoria,Preço,Liga,Dificuldade,Versão do Jogo,Descrição,URL da Imagem\n' +
      'Divine Orb,currency,10,Standard,softcore,path-of-exile-1,Moeda divina,https://example.com/divine-orb.png\n' +
      'Exalted Orb,currency,5,Standard,softcore,path-of-exile-1,Moeda exaltada,https://example.com/exalted-orb.png';

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-produtos.csv';
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
      console.log('Fetching leagues for gameVersion:', gameVersion);

      // Try using the existing getLeagues function first
      try {
        const { getLeagues } = await import('@/app/actions');
        const leagues = await getLeagues(gameVersion as 'path-of-exile-1' | 'path-of-exile-2');
        console.log('Leagues from getLeagues:', leagues);
        setAvailableLeagues(leagues || []);
        return;
      } catch (importError) {
        console.log('getLeagues not available, trying API...');
      }

      // Fallback to API
      const response = await fetch(`/api/admin/leagues?gameVersion=${gameVersion}`);
      console.log('Response status:', response.status);

      if (response.ok) {
        const leagues = await response.json();
        console.log('Leagues fetched from API:', leagues);
        setAvailableLeagues(leagues);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
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
      console.log('Fetching leagues for filter gameVersion:', gameVersion);

      // Try using the existing getLeagues function first
      try {
        const { getLeagues } = await import('@/app/actions');
        const leagues = await getLeagues(gameVersion as 'path-of-exile-1' | 'path-of-exile-2');
        console.log('Leagues for filter from getLeagues:', leagues);
        setAvailableLeaguesForFilter(leagues || []);
        return;
      } catch (importError) {
        console.log('getLeagues not available for filter, trying API...');
      }

      // Fallback to API
      const response = await fetch(`/api/admin/leagues?gameVersion=${gameVersion}`);
      console.log('Filter response status:', response.status);

      if (response.ok) {
        const leagues = await response.json();
        console.log('Leagues for filter fetched from API:', leagues);
        setAvailableLeaguesForFilter(leagues);
      } else {
        const errorData = await response.json();
        console.error('Error response for filter:', errorData);
      }
    } catch (error) {
      console.error('Error fetching leagues for filter:', error);
    } finally {
      setLoadingLeaguesForFilter(false);
    }
  };

  // Orders management functions
  const fetchOrdersForManagement = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch('/api/admin/orders');

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      // Atualizar a lista local
      fetchOrdersForManagement();
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order status');
    }
  };

  const statusColumns = {
    processing: { title: 'Processando', color: 'bg-yellow-500', nextStatus: 'waiting_delivery' as const, prevStatus: null },
    waiting_delivery: { title: 'Aguardando Entrega', color: 'bg-blue-500', nextStatus: 'completed' as const, prevStatus: 'processing' as const },
    completed: { title: 'Concluído', color: 'bg-green-500', nextStatus: null, prevStatus: 'waiting_delivery' as const },
    failed: { title: 'Falhou', color: 'bg-red-500', nextStatus: null, prevStatus: 'processing' as const }
  };

  const getGridCols = () => {
    const count = selectedStatuses.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  const toggleStatus = (status: 'processing' | 'waiting_delivery' | 'completed' | 'failed') => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
  };

  const getSelectedStatusText = () => {
    if (selectedStatuses.length === 4) return 'Todos os Status';
    if (selectedStatuses.length === 0) return 'Selecionar Status';
    return `${selectedStatuses.length} Status Selecionados`;
  };

  const handleMoveOrderClick = (orderId: string, newStatus: 'processing' | 'waiting_delivery' | 'completed' | 'failed', orderNumber: string, direction: 'next' | 'prev') => {
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
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Filtros */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Intervalo</span>
                </div>
                <Select
                  value={filters.range}
                  onValueChange={(value) => setFilters((s) => ({ ...s, range: value as RangeKey }))}
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
                  <span className="text-sm font-medium text-foreground">Status</span>
                </div>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((s) => ({ ...s, status: value as StatusKey }))}
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-card-foreground">
                    {formatCurrency(stats.revenue, 'BRL')}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-card-foreground">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    24h: {stats.last24hOrders}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ticket médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-card-foreground">
                    {formatCurrency(stats.avgOrderValue, 'BRL')}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Conclusão</CardTitle>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Status dos pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-2 w-full rounded bg-muted overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${pct.completed}%` }} />
                  <div className="h-full bg-yellow-500" style={{ width: `${pct.processing}%` }} />
                  <div className="h-full bg-blue-500" style={{ width: `${pct.waitingDelivery}%` }} />
                  <div className="h-full bg-red-500" style={{ width: `${pct.failed}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-card-foreground flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded bg-green-500" /> Concluídos {stats.completedOrders} ({pct.completed}%)
                  </span>
                  <span className="text-card-foreground flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded bg-yellow-500" /> Processando {stats.processingOrders} ({pct.processing}%)
                  </span>
                  <span className="text-card-foreground flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded bg-blue-500" /> Aguardando Entrega {stats.waitingDeliveryOrders} ({pct.waitingDelivery}%)
                  </span>
                  <span className="text-card-foreground flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded bg-red-500" /> Falhos {stats.failedOrders} ({pct.failed}%)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Secundário: totais rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-card-foreground">{stats.totalProducts}</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ligas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-card-foreground">{stats.totalLeagues}</div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sistema</CardTitle>
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
                <CardTitle className="text-card-foreground">Pedidos recentes</CardTitle>
                <Button
                  onClick={() => onViewChange('orders')}
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
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <p className="text-card-foreground font-medium">#{String(order.id).slice(0, 8)}</p>
                            <p className="text-muted-foreground text-sm">{order.character_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-card-foreground font-medium">
                            {formatCurrency(order.total_amount, (order.currency || 'BRL').toUpperCase())}
                          </p>
                          <Badge className={`${getStatusColor(order.status)} text-white`}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Sem pedidos recentes</p>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 'add-product':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Adicionar Novo Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">Nome do Produto</Label>
                      <Input
                        id="name"
                        required
                        value={productForm.name}
                        onChange={(e) => {
                          const newName = e.target.value;
                          setProductForm({
                            ...productForm,
                            name: newName,
                            slug: generateSlug(newName, productForm.gameVersion, productForm.league, productForm.difficulty)
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
                            slug: generateSlug(productForm.name, productForm.gameVersion, value, productForm.difficulty)
                          });
                        }}
                        disabled={loadingLeagues}
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder={loadingLeagues ? "Carregando ligas..." : "Selecione a liga"} />
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
                      <Label htmlFor="slug" className="text-foreground">Slug</Label>
                      <Input
                        id="slug"
                        required
                        value={productForm.slug}
                        onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="Slug gerado automaticamente"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-foreground">Preço</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="price"
                          type="number"
                          required
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                          className="bg-card border-border text-card-foreground focus:border-primary pl-7"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imgUrl" className="text-foreground">URL da Imagem</Label>
                      <Input
                        id="imgUrl"
                        required
                        value={productForm.imgUrl}
                        onChange={(e) => setProductForm({ ...productForm, imgUrl: e.target.value })}
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="Digite a URL da imagem"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Versão do Jogo</Label>
                      <Select
                        value={productForm.gameVersion as "path-of-exile-1" | "path-of-exile-2"}
                        onValueChange={(value: "path-of-exile-1" | "path-of-exile-2") => {
                          setProductForm({
                            ...productForm,
                            gameVersion: value,
                            slug: generateSlug(productForm.name, value, productForm.league, productForm.difficulty)
                          });
                        }}
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder="Selecione a versão do jogo" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
                          <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Categoria</Label>
                      <Select
                        value={productForm.category}
                        onValueChange={(value) => setProductForm({ ...productForm, category: value })}
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
                            slug: generateSlug(productForm.name, productForm.gameVersion, productForm.league, value)
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
                      <Label htmlFor="alt" className="text-foreground">Alt da Imagem</Label>
                      <Textarea
                        id="alt"
                        value={productForm.alt}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProductForm({ ...productForm, alt: e.target.value })}
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

      case 'bulk-products':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Criar Produtos em Massa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Instructions */}
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">Como usar:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Baixe o template CSV clicando em "Baixar Template"</li>
                      <li>Preencha o arquivo com os dados dos produtos</li>
                      <li>Faça upload do arquivo usando o botão "Selecionar Arquivo"</li>
                      <li>Revise os produtos carregados</li>
                      <li>Clique em "Criar Produtos" para processar</li>
                    </ol>
                  </div>

                  {/* Template Download */}
                  <div className="flex gap-3">
                    <Button onClick={downloadTemplate} variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Baixar Template
                    </Button>
                    <Button
                      onClick={() => document.getElementById('bulk-file-input')?.click()}
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
                        <span>{bulkProgress.current} / {bulkProgress.total}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {bulkResults.success > 0 || bulkResults.failed > 0 ? (
                    <div className="space-y-2">
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-600">✓ {bulkResults.success} sucessos</span>
                        <span className="text-red-600">✗ {bulkResults.failed} falhas</span>
                      </div>
                      {bulkResults.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <h4 className="font-semibold text-red-800 mb-2">Erros:</h4>
                          <ul className="text-sm text-red-700 space-y-1">
                            {bulkResults.errors.slice(0, 5).map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                            {bulkResults.errors.length > 5 && (
                              <li>... e mais {bulkResults.errors.length - 5} erros</li>
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
                            {bulkLoading ? 'Criando...' : 'Criar Produtos'}
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
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                              <div className="flex-1">
                                <div className="font-medium text-foreground">{product.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {product.category} • ${product.price} • {product.league} • {product.difficulty}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {product.gameVersion === 'path-of-exile-1' ? 'POE 1' : 'POE 2'}
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

      case 'add-league':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Adicionar Nova Liga</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLeagueSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-foreground">Nome da Liga</Label>
                      <Input
                        id="name"
                        required
                        value={leagueForm.name}
                        onChange={(e) => setLeagueForm({ ...leagueForm, name: e.target.value })}
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="Digite o nome da liga"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-foreground">URL da Imagem</Label>
                      <Input
                        id="imageUrl"
                        required
                        value={leagueForm.imageUrl}
                        onChange={(e) => setLeagueForm({ ...leagueForm, imageUrl: e.target.value })}
                        className="bg-card border-border text-card-foreground focus:border-primary"
                        placeholder="Digite a URL da imagem"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground">Versão do Jogo</Label>
                      <Select
                        value={leagueForm.gameVersion}
                        onValueChange={(value: "path-of-exile-1" | "path-of-exile-2") =>
                          setLeagueForm({ ...leagueForm, gameVersion: value })
                        }
                      >
                        <SelectTrigger className="bg-card border-border text-card-foreground focus:border-primary">
                          <SelectValue placeholder="Selecione a versão do jogo" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
                          <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description" className="text-foreground">Descrição</Label>
                      <Textarea
                        id="description"
                        value={leagueForm.description}
                        onChange={(e) => setLeagueForm({ ...leagueForm, description: e.target.value })}
                        className="w-full bg-card border border-border text-card-foreground focus:border-primary min-h-[100px] resize-y rounded-md p-2"
                        placeholder="Digite a descrição da liga"
                      />
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

      case 'manage-products':
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
                <CardTitle className="text-card-foreground">Gerenciar Produtos</CardTitle>
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
                        <SelectItem value="All Versions">Todas as Versões</SelectItem>
                        <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
                        <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedLeague}
                      onValueChange={setSelectedLeague}
                      disabled={loadingLeaguesForFilter}
                    >
                      <SelectTrigger className="bg-card border-border text-card-foreground">
                        <SelectValue placeholder={loadingLeaguesForFilter ? "Carregando ligas..." : "Liga"} />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="All Leagues">Todas as Ligas</SelectItem>
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
                        <SelectItem value="All Difficulties">Todas as Dificuldades</SelectItem>
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
                      <div key={product.id} className="p-4 border border-border rounded-lg bg-muted/20">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-card-foreground">{product.name}</h3>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${product.in_stock !== false
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                                }`}>
                                {product.in_stock !== false ? 'Em Estoque' : 'Sem Estoque'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Preço atual: ${product.price} | {product.league} | {product.difficulty}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Stock toggle */}
                            <Button
                              onClick={() => product.id && handleToggleStock(product.id, product.in_stock !== false)}
                              size="sm"
                              className={product.in_stock !== false
                                ? 'bg-red-700 hover:bg-red-800 text-white font-semibold'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white font-semibold'
                              }
                            >
                              {product.in_stock !== false ? 'Tirar do Estoque' : 'Colocar em Estoque'}
                            </Button>

                            {/* Price update */}
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                  type="number"
                                  placeholder="Novo preço"
                                  value={newPrice}
                                  onChange={(e) => setNewPrice(Number(e.target.value))}
                                  className="w-24 pl-7 bg-card border-border text-card-foreground focus:border-primary"
                                />
                              </div>
                              <Button
                                onClick={() => product.id && handleUpdatePrice(product.id)}
                                disabled={updatingId === product.id}
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                              >
                                {updatingId === product.id ? 'Atualizando...' : 'Atualizar'}
                              </Button>
                            </div>

                            <Button
                              onClick={() => product.id && handleDeleteProduct(product.id)}
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
                        <p className="text-muted-foreground">Nenhum produto encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'manage-leagues':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Gerenciar Ligas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Funcionalidade de gerenciamento de ligas será implementada aqui.</p>
              </CardContent>
            </Card>
          </div>
        );

      case 'orders':
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
              <h1 className="text-2xl font-bold text-card-foreground">Gerenciar Pedidos</h1>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-between bg-card border-border text-card-foreground">
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
                      {Object.entries(statusColumns).map(([status, { title, color }]) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={status}
                            checked={selectedStatuses.includes(status as 'processing' | 'waiting_delivery' | 'completed' | 'failed')}
                            onCheckedChange={() => toggleStatus(status as 'processing' | 'waiting_delivery' | 'completed' | 'failed')}
                            className="border-border"
                          />
                          <label
                            htmlFor={status}
                            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            <div className={`w-3 h-3 rounded-full ${color}`} />
                            {title}
                          </label>
                        </div>
                      ))}
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
                  .filter(([status]) => selectedStatuses.includes(status as 'processing' | 'waiting_delivery' | 'completed' | 'failed'))
                  .map(([status, { title, color, nextStatus }]) => {
                    const statusOrders = orders.filter(order => order.status === status);
                    return (
                      <div key={status} className="bg-muted/10 rounded-lg p-4 min-h-[600px]">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-semibold text-card-foreground">{title}</h2>
                          <Badge className={`${color} text-white text-xs`}>
                            {statusOrders.length}
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {statusOrders.length > 0 ? (
                            statusOrders.map((order) => (
                              <Card key={order.id} className="bg-card border-border hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-card-foreground">
                                      #{String(order.id).slice(0, 8)}
                                    </CardTitle>
                                    <Badge className={`${color} text-white text-xs`}>
                                      {order.status}
                                    </Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-muted-foreground">Personagem</p>
                                      <p className="text-sm font-medium text-card-foreground truncate">{order.character_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Email</p>
                                      <p className="text-xs text-card-foreground truncate">{order.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Valor Total</p>
                                      <p className="text-sm font-semibold text-card-foreground">{formatPrice(order.total_amount, order.currency)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground">Data</p>
                                      <p className="text-xs text-card-foreground">
                                        {new Date(order.created_at).toLocaleString('pt-BR', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="border-t border-border pt-3">
                                    <p className="text-xs text-muted-foreground mb-2">Itens</p>
                                    <div className="space-y-1">
                                      {order.items.slice(0, 2).map((item, index) => (
                                        <div key={index} className="flex justify-between text-xs">
                                          <span className="text-muted-foreground truncate flex-1 mr-2">
                                            {item.product.name}
                                          </span>
                                          <span className="text-muted-foreground whitespace-nowrap">
                                            {formatPrice(item.product.price * item.quantity, order.currency)}
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
                                        onClick={() => handleMoveOrderClick(order.id, nextStatus, String(order.id).slice(0, 8), 'next')}
                                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-2"
                                      >
                                        Mover para {statusColumns[nextStatus].title}
                                      </Button>
                                    )}
                                    {statusColumns[status as keyof typeof statusColumns].prevStatus && (
                                      <Button
                                        onClick={() => handleMoveOrderClick(order.id, statusColumns[status as keyof typeof statusColumns].prevStatus!, String(order.id).slice(0, 8), 'prev')}
                                        variant="outline"
                                        className="w-full border-border text-foreground hover:bg-accent text-xs py-2"
                                      >
                                        Voltar para {statusColumns[statusColumns[status as keyof typeof statusColumns].prevStatus!].title}
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
              description={`Tem certeza que deseja ${orderToMove?.direction === 'next' ? 'mover' : 'voltar'} o pedido #${orderToMove?.orderNumber || ''} ${orderToMove?.direction === 'next' ? 'para' : 'para'} ${orderToMove ? statusColumns[orderToMove.newStatus].title : ''}?`}
              confirmText="Confirmar"
              cancelText="Cancelar"
              variant="default"
            />
          </div>
        );

      case 'cache':
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Gerenciar Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    Use os botões abaixo para limpar o cache de diferentes tipos de conteúdo.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <RevalidateCacheButton type="post" label="Limpar Cache do Blog" variant="outline" />
                    <RevalidateCacheButton type="product" label="Limpar Cache de Produtos" variant="outline" />
                    <RevalidateCacheButton type="author" label="Limpar Cache de Autores" variant="outline" />
                    <RevalidateCacheButton type="category" label="Limpar Cache de Categorias" variant="outline" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-card-foreground">Página não encontrada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">A página solicitada não foi encontrada.</p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderView()}
    </div>
  );
}
