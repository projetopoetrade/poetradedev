'use client'
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

export function ProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceMin, setPriceMin] = useState(searchParams.get('min') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('max') || '');
  const [showFilters, setShowFilters] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (priceMin) params.set('min', priceMin);
    if (priceMax) params.set('max', priceMax);
    
    router.push(`/products?${params.toString()}`);
  };
  
  const handleReset = () => {
    setQuery('');
    setCategory('');
    setPriceMin('');
    setPriceMax('');
    router.push('/products');
  };
  
  return (
    <div className="w-full space-y-4 mb-8">
      <form onSubmit={handleSearch} className="flex w-full space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            type="search" 
            placeholder="Search products..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
          {query && (
            <button 
              type="button" 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <Button type="submit" variant="default">Search</Button>
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </form>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg">
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
                <SelectItem value="items">Items</SelectItem>
                <SelectItem value="services">Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Price Min ($)</label>
            <Input
              type="number"
              placeholder="Min Price"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Price Max ($)</label>
            <Input
              type="number"
              placeholder="Max Price"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
            />
          </div>
          
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleReset}
            className="md:col-span-3"
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
} 