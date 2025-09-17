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
  user_id: string;
  created_at: string;
  updated_at: string;
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