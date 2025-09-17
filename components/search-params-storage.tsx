"use client";

import { useEffect } from "react";

type SearchParams = {
  gameVersion?: string;
  league?: string;
  difficulty?: string;
  category?: string;
  search?: string;
};

interface SearchParamsStorageProps {
  searchParams: SearchParams;
}

export function SearchParamsStorage({ searchParams }: SearchParamsStorageProps) {
  useEffect(() => {
    // Convert searchParams object to URLSearchParams
    const params = new URLSearchParams();
    
    // Add each search parameter if it exists
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // Store in localStorage
    localStorage.setItem('productSearchParams', params.toString());
  }, [searchParams]);

  // This component doesn't render anything
  return null;
} 