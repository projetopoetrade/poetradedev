'use client'

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button as PopoverButton } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { useTranslations } from "next-intl";

type OrderStatus = 'processing' | 'waiting_delivery' | 'completed' | 'failed';

interface StatusColumn {
  title: string;
  color: string;
  nextStatus: OrderStatus | null;
}

const statusColumns: Record<OrderStatus, StatusColumn> = {
  processing: { title: 'Processing', color: 'bg-yellow-500', nextStatus: 'waiting_delivery' },
  waiting_delivery: { title: 'Waiting Delivery', color: 'bg-blue-500', nextStatus: 'completed' },
  completed: { title: 'Completed', color: 'bg-green-500', nextStatus: null },
  failed: { title: 'Failed', color: 'bg-red-500', nextStatus: null }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>(['processing', 'waiting_delivery', 'completed', 'failed']);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToMove, setOrderToMove] = useState<{ orderId: string; newStatus: OrderStatus; orderNumber: string } | null>(null);
  const supabase = createClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const t = useTranslations('Orders');

  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    fetchOrders();

    const channel = supabase.channel('orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders' 
        }, 
        (payload) => {
          console.log('Change received!', payload);
          
          if (payload.eventType === 'INSERT') {
            audioRef.current?.play().catch(error => {
              console.error('Error playing sound:', error);
            });
          }
          
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function fetchOrders() {
    try {
      // Usar API admin para buscar todas as orders (bypassa RLS)
      const response = await fetch('/api/admin/orders');
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      // Usar API admin para atualizar order (bypassa RLS)
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
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  }

  const getGridCols = () => {
    const count = selectedStatuses.length;
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
  };

  const toggleStatus = (status: OrderStatus) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
  };

  const getSelectedStatusText = () => {
    if (selectedStatuses.length === 4) return 'All Statuses';
    if (selectedStatuses.length === 0) return 'Select Statuses';
    return `${selectedStatuses.length} Statuses Selected`;
  };

  const handleMoveOrderClick = (orderId: string, newStatus: OrderStatus, orderNumber: string) => {
    setOrderToMove({ orderId, newStatus, orderNumber });
    setConfirmDialogOpen(true);
  };

  const handleConfirmMove = async () => {
    if (orderToMove) {
      await updateOrderStatus(orderToMove.orderId, orderToMove.newStatus);
      setOrderToMove(null);
    }
    setConfirmDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h2 className="text-xl font-medium">Loading orders...</h2>
        </div>
      </div>
    );
  }

  return (
    <main className="container py-12">
      <div className="max-w-8xl mx-auto">
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-100">Orders Dashboard</h1>
            <Popover>
              <PopoverTrigger asChild>
                <PopoverButton variant="outline" className="w-[200px] justify-between bg-black border-gray-700 text-white">
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
                </PopoverButton>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-4 bg-black border-gray-700">
                <div className="space-y-4">
                  {Object.entries(statusColumns).map(([status, { title, color }]) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={selectedStatuses.includes(status as OrderStatus)}
                        onCheckedChange={() => toggleStatus(status as OrderStatus)}
                        className="border-gray-600"
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
          </div>
        </div>
        
        <div className={`grid ${getGridCols()} gap-4`}>
          {Object.entries(statusColumns)
            .filter(([status]) => selectedStatuses.includes(status as OrderStatus))
            .map(([status, { title, color, nextStatus }]) => (
              <div key={status} className="bg-black/50 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-gray-100 mb-4">{title}</h2>
                <div className="space-y-4 min-h-[200px]">
                  {orders
                    .filter(order => order.status === status)
                    .map((order) => (
                      <Card key={order.id} className="bg-black border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-xl font-bold text-gray-100">
                            Order #{String(order.id).slice(0, 8)}
                          </CardTitle>
                          <Badge className={`${color} text-white`}>
                            {order.status}
                          </Badge>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <p className="text-sm text-gray-400">Character</p>
                              <p className="text-gray-100">{order.character_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Email</p>
                              <p className="text-gray-100">{order.email}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Total Amount</p>
                              <p className="text-gray-100">{formatPrice(order.total_amount, order.currency)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Date</p>
                              <p className="text-gray-100">
                                {new Date(order.created_at).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <p className="text-sm text-gray-400 mb-2">Items</p>
                            <div className="space-y-2">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-gray-300">
                                    {item.product.name} (Qty: {item.quantity})
                                  </span>
                                  <span className="text-gray-300">
                                    {formatPrice(item.product.price * item.quantity, order.currency)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {nextStatus && (
                            <Button
                              onClick={() => handleMoveOrderClick(order.id, nextStatus, String(order.id).slice(0, 8))}
                              className="w-full mt-4 bg-primary hover:bg-primary/90"
                            >
                              Move to {statusColumns[nextStatus].title}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>

      <ConfirmationDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmMove}
        title={t('confirmMoveTitle')}
        description={t('confirmMoveDescription', { 
          orderId: orderToMove?.orderNumber || '', 
          newStatus: orderToMove ? statusColumns[orderToMove.newStatus].title : '' 
        })}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
        variant="default"
      />
    </main>
  );
} 