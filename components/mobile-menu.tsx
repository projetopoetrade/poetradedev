// components/mobile-menu.tsx
"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

// This component is now a generic wrapper for a mobile menu sheet.
// It handles its own open/close state.
export function MobileMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        {/*
          When a link inside is clicked, we want to close the menu.
          We can wrap the children in a div and add an onClick handler.
        */}
        <div onClick={() => setIsOpen(false)}>{children}</div>
      </SheetContent>
    </Sheet>
  );
}