'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import type { Product } from "@/lib/interface";
import { toast } from "sonner";
import { getProducts } from "@/app/actions";
import { createBrowserClient } from "@supabase/ssr";

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [selectedGameVersion, setSelectedGameVersion] = useState<string>("All Versions");
  const [selectedLeague, setSelectedLeague] = useState<string>("All Leagues");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All Difficulties");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
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
      const { error } = await supabase
        .from('products')
        .update({ price })
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(products.map(product => 
        product.id === productId ? { ...product, price } : product
      ));
      toast.success('Price updated successfully');
      setNewPrice(0);
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      setProducts(products.filter(product => product.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleClearFilters = () => {
    setSelectedGameVersion(() => "All Versions");
    setSelectedLeague(() => "All Leagues");
    setSelectedDifficulty(() => "All Difficulties");
    
    console.log('Clearing filters...');
  };

  useEffect(() => {
    console.log('Filters updated:', {
      gameVersion: selectedGameVersion,
      league: selectedLeague,
      difficulty: selectedDifficulty
    });
  }, [selectedGameVersion, selectedLeague, selectedDifficulty]);

  if (loading) {
    return (
      <main className="container h-min-screen ">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container h-min-screen mb-10">
      <div className="max-w-4xl mx-auto p-6 rounded-lg shadow-md bg-black border border-gray-400/20">
        <h1 className="text-2xl font-bold text-gray-slate-100 mb-6">Manage Products</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select
            value={selectedGameVersion}
            onValueChange={setSelectedGameVersion}
          >
            <SelectTrigger>
              <SelectValue placeholder="Game Version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Versions">All Versions</SelectItem>
              <SelectItem value="path-of-exile-1">Path of Exile 1</SelectItem>
              <SelectItem value="path-of-exile-2">Path of Exile 2</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedLeague}
            onValueChange={setSelectedLeague}
          >
            <SelectTrigger>
              <SelectValue placeholder="League" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Leagues">All Leagues</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Settlers of Kalguur">Settlers of Kalguur</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedDifficulty}
            onValueChange={setSelectedDifficulty}
          >
            <SelectTrigger>
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Difficulties">All Difficulties</SelectItem>
              <SelectItem value="softcore">Softcore</SelectItem>
              <SelectItem value="hardcore">Hardcore</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end mb-6">
          <Button 
            onClick={handleClearFilters}
            className="bg-slate-200 hover:bg-slate-300 font-bold"
          >
            Clear Filters
          </Button>
        </div>

        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-4 border  rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-slate-100">{product.name}</h3>
                  <p className="text-sm text-gray-400">Current Price: ${product.price}</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <Input
                        type="number"
                        placeholder="New price"
                        value={newPrice}
                        onChange={(e) => setNewPrice(Number(e.target.value))}
                        className="w-16 pl-7 mr-4 font-roboto [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <Button
                      onClick={() => product.id && handleUpdatePrice(product.id)}
                      disabled={updatingId === product.id}
                      className="bg-slate-200 hover:bg-slate-300 font-bold "
                    >
                      {updatingId === product.id ? 'Updating...' : 'Update Price'}
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => product.id && handleDeleteProduct(product.id)}
                    className="bg-red-500 hover:bg-red-600 font-bold"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredProducts.length === 0 && (
            <p className="text-center text-gray-400">No products found</p>
          )}
        </div>
      </div>
    </main>
  );
} 