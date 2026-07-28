// Shared types used across dashboard view components

export interface DashboardStats {
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

export interface RecentOrder {
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

export type RangeKey = "24h" | "7d" | "30d" | "all";
export type StatusKey =
  | "all"
  | "completed"
  | "processing"
  | "waiting_delivery"
  | "failed";

export type LeagueAdmin = {
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
  /** Preço do Divine Orb em USD nesta liga — âncora de todo o catálogo. */
  divine_usd: number | null;
  /** Margem sobre o mercado, em fração (0.5 = +50%). */
  price_markup: number | null;
  updated_at: string | null;
};
