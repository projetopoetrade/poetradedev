"use client";

import { useState, useEffect } from "react";
import { FilterModal } from "./filter-modal";

interface FilterModalWrapperProps {
  searchParams: {
    gameVersion?: string;
    league?: string;
    difficulty?: string;
    category?: string;
    search?: string;
  };
}

export function FilterModalWrapper({ searchParams }: FilterModalWrapperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if user has no filters selected
    const hasFilters = searchParams.gameVersion && searchParams.league && searchParams.difficulty;
    
    // Only show modal if no filters are present
    if (!hasFilters) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <FilterModal 
      open={isModalOpen} 
      onOpenChange={setIsModalOpen} 
    />
  );
}