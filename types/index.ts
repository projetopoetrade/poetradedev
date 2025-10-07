export interface Order {
  id: string;
  character_name: string;
  email: string;
  items: OrderItem[];
  total_amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  payment_intent: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    created: number;
  } | null;
  stripe_session_id: string | null;
  pix_id: string | null; // ID do PIX da AbacatePay
  user_id: string;
  observations?: string | null;
  created_at: string;
  updated_at: string;
  paid_at?: string | null; // Data e hora em que o pagamento foi confirmado
}

export interface PatchData {
  id: string // Adicionamos um ID para usar como key
  version: string
  title: string
  date: string
  description: string
  changes: string[]
  features?: {
    title: string
    description: string
  }[]
}

export interface OrderItem {
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
} 