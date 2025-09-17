"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "./ui/select";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function ProductSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize with empty values first
  const [searchTerm, setSearchTerm] = useState("");
  const [league, setLeague] = useState("any");
  const [difficulty, setDifficulty] = useState("any");
  const [isInitialized, setIsInitialized] = useState(false);

  // Available options for dropdowns
  const leagueOptions = ["Standard", "Settlers of Kalguur"];
  const difficultyOptions = ["softcore", "hardcore"];

  // Set initial values from URL parameters after component mounts
  useEffect(() => {
    if (searchParams) {
      setSearchTerm(searchParams.get("name") || "");
      setLeague(searchParams.get("league") || "any");
      setDifficulty(searchParams.get("difficulty") || "any");
      setIsInitialized(true);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the URL path
    let path = `/products/${encodeURIComponent(searchTerm)}`;
    
    // Add query parameters if they exist
    const params = new URLSearchParams();
    if (league && league !== "any") params.set("league", league);
    if (difficulty && difficulty !== "any") params.set("difficulty", difficulty);
    
    // Add query string if there are params
    const queryString = params.toString();
    if (queryString) {
      path += `?${queryString}`;
    }
    
    router.push(path);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto p-4 bg-card rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <label htmlFor="productName" className="text-sm font-medium">
            Product Name
          </label>
          <div className="relative">
            <Input
              id="productName"
              type="text"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              required
            />
            <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="league" className="text-sm font-medium">
            League
          </label>
          <Select value={league} onValueChange={setLeague}>
            <SelectTrigger id="league">
              <SelectValue placeholder="Select league" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any League</SelectItem>
              {leagueOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="difficulty" className="text-sm font-medium">
            Difficulty
          </label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Difficulty</SelectItem>
              {difficultyOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
        Search Products
      </Button>
    </form>
  );
} 