"use client";
import type { Product } from "@/lib/interface";
import ProductCard from "./product-card";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ProductSkeleton } from "./ui/skeleton";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import FiltersToggle from "./filters-toggle";

interface ProductsClientProps {
  products: Product[];
  initialFilters: {
    gameVersion: string;
    league: string;
    difficulty: string;
  };
}

export default function ProductsClient({ products, initialFilters }: ProductsClientProps) {
  const t = useTranslations('Products');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const buttons = [
    { label: t("allCategories"), value: "All Categories" },
    { label: t("currency"), value: "Currency" },
    { label: t("services"), value: "Services" },
    { label: t("items"), value: "Items" },
  ];
  const [selectedFilter, setSelectedFilter] = useState<string>("All Categories");
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize filter from URL search params if available
  useEffect(() => {
    const category = searchParams.get("category");
    if (category && buttons.some(b => b.value === category)) {
      setSelectedFilter(category);
    }
    
    const search = searchParams.get("search");
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  // Simulate loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const filterTags = (products: Product[]): Product[] => {
    let filteredProducts = products;
    
    // Apply category filter
    if (selectedFilter.toLowerCase() !== "all categories") {
      filteredProducts = filteredProducts.filter(
        (el) => el.category.toLowerCase() === selectedFilter.toLowerCase()
      );
    }
    
    // Apply search term filter (client-side)
    if (searchTerm.trim() !== "") {
      filteredProducts = filteredProducts.filter(
        (product) => product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filteredProducts;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search parameters
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchTerm) {
      params.set("search", searchTerm);
    } else {
      params.delete("search");
    }
    
    // Find the button object corresponding to selectedFilter
    const selectedButton = buttons.find(button => button.value === selectedFilter || button.label === selectedFilter);

    if (selectedButton && selectedButton.value !== "All Categories") {
      params.set("category", selectedButton.value);
    } else {
      params.delete("category");
    }
    
    router.push(`/products?${params.toString()}`);
  };

  const filteredList = filterTags(products);

  return (
    <div className="border rounded-b-lg py-4 md:min-h-[678px] bg-black/5 mb-12">
      <div className="flex flex-col gap-4 px-3 mb-4">
        {/* Search and Filters Section */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Category Buttons */}
          <nav className="flex flex-wrap gap-2 flex-1" aria-label="Filters">
            {buttons.map((button) => (
              <Button
                key={button.value}
                variant="secondary"
                className={`flex-1 sm:flex-none min-w-[100px] text-sm md:text-base font-bold hover:bg-indigo-600 ${
                  selectedFilter === button.value ? "bg-indigo-600 text-white" : ""
                }`}
                onClick={() => setSelectedFilter(button.value)}
                aria-label={`Filter by ${button.label}`}
              >
                {button.label}
              </Button>
            ))}
          </nav>

          {/* Search and Advanced Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="flex-1 sm:w-64">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-0 top-0 h-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Advanced Filters */}
            <div className="w-full sm:w-auto">
              <FiltersToggle
                currentGameVersion={initialFilters.gameVersion}
                currentLeague={initialFilters.league}
                currentDifficulty={initialFilters.difficulty}
                open={isFiltersOpen}
                onOpenChange={setIsFiltersOpen}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-3">
        {!isLoaded ? (
          // Show skeletons while loading
          Array(4).fill(0).map((_, index) => (
            <div key={index}>
              <ProductSkeleton />
            </div>
          ))
        ) : filteredList.length > 0 ? (
          // Show products
          filteredList.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          // Show empty state
          <div className="col-span-full text-center py-12">
            <p className="text-lg text-muted-foreground">
              {t("noProductsFound")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
