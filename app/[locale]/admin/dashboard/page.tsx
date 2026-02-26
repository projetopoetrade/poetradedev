'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Users,
  ShoppingCart,
  Plus,
  BarChart3,
  Home,
  ChevronRight,
  RefreshCw,
  Database,
  Sword
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardViews from './components/DashboardViews';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const handleRefresh = () => {
      setLastUpdated(new Date());
    // Force refresh of DashboardViews
    window.location.reload();
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Dashboard';
      case 'add-product':
        return 'Novo Produto';
      case 'bulk-products':
        return 'Produtos em Massa';
      case 'add-league':
        return 'Nova Liga';
      case 'manage-products':
        return 'Gerenciar Produtos';
      case 'orders':
        return 'Pedidos';
      case 'cache':
        return 'Gerenciar Cache';
      case 'builds':
        return 'Builds';
      case 'add-build':
        return 'Nova Build';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar fixa */}
        <aside
          aria-label="Admin Sidebar"
          className="fixed inset-y-0 left-0 w-64 border-r border-border/50 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <div className="h-16 flex items-center px-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-foreground/80" />
              <h1 className="text-base font-semibold text-foreground">Admin</h1>
              <Badge variant="outline" className="text-green-500 border-green-500">Live</Badge>
            </div>
          </div>

          <nav className="px-2 py-3 space-y-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'dashboard'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveView('add-product')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'add-product'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Novo Produto</span>
            </button>
            
            <button
              onClick={() => setActiveView('bulk-products')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'bulk-products'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Produtos em Massa</span>
            </button>
            
            <button
              onClick={() => setActiveView('add-league')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'add-league'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Nova Liga</span>
            </button>
            
            <button
              onClick={() => setActiveView('manage-products')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'manage-products'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Produtos</span>
            </button>
            
            <button
              onClick={() => setActiveView('orders')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'orders'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Pedidos</span>
            </button>
            
            <button
              onClick={() => setActiveView('cache')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'cache'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Cache</span>
            </button>

            <div className="pt-2 pb-1 px-3">
              <span className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium">Builds</span>
            </div>

            <button
              onClick={() => setActiveView('builds')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'builds'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Sword className="h-4 w-4" />
              <span>Gerenciar Builds</span>
            </button>

            <button
              onClick={() => setActiveView('add-build')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors ${
                activeView === 'add-build'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/80 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Nova Build</span>
            </button>
          </nav>
        </aside>

        {/* Conteúdo principal */}
        <main id="main" className="flex-1 pl-64">
          <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
            {/* Top bar do conteúdo */}
            <div className="flex items-center justify-between">
              <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">
                  <Home className="h-4 w-4" />
            </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href="/admin" className="hover:text-foreground transition-colors">
                  Admin
            </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground">{getViewTitle()}</span>
          </nav>

              <div className="flex items-center gap-3">
            {lastUpdated && (
                  <span className="text-xs text-muted-foreground">
                Atualizado {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            )}
            <Button
                  onClick={handleRefresh}
              variant="outline"
              size="sm"
                  className="border-border text-foreground hover:bg-accent"
              title="Atualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

            {/* Renderiza a view ativa */}
            <DashboardViews activeView={activeView} onViewChange={setActiveView} />
        </div>
      </main>
      </div>
    </div>
  );
}