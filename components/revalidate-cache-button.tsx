'use client'

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { revalidateCacheAction } from "@/app/actions";

interface RevalidateCacheButtonProps {
  type?: 'post' | 'product' | 'author' | 'category';
  label?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

export default function RevalidateCacheButton({ 
  type = 'post',
  label = 'Clear Cache',
  variant = 'outline'
}: RevalidateCacheButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRevalidate = async () => {
    setLoading(true);
    try {
      // Server action, não `fetch` com Bearer: o segredo que ia aqui era
      // `NEXT_PUBLIC_*` (logo, público) e caía num default que a rota aceitava.
      // A sessão do admin é verificada no servidor — ver `revalidateCacheAction`.
      const result = await revalidateCacheAction(type);

      if (result.ok) {
        toast.success(`Cache cleared successfully for ${type}!`, {
          description: `Revalidated at ${new Date().toLocaleTimeString()}`
        });
      } else {
        throw new Error(result.error || 'Failed to revalidate');
      }
    } catch (error) {
      console.error('Error revalidating cache:', error);
      toast.error('Failed to clear cache', {
        description: 'Please try again or check the console for errors.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRevalidate}
      disabled={loading}
      variant={variant}
      className="gap-2 w-full"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Clearing...
        </>
      ) : (
        <>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          {label}
        </>
      )}
    </Button>
  );
}

