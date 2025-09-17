'use client';

import { Menu, Package, LogOut, User, Search } from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetTitle,
  SheetHeader
} from "./ui/sheet";
import { Button } from "./ui/button";
import Link from "next/link";
import { useState } from "react";
import { CurrencyIndicator } from "./currency-indicator";
import { useCart } from "@/lib/contexts/cart-context";
import { signOutAction } from "@/app/actions";

export function MobileMenu({ isAuthenticated = false }) {
  const [open, setOpen] = useState(false);
  const { items } = useCart();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-background border-white/10 p-0">
        <SheetHeader className="pt-6 pb-2 border-b border-white/10">
          <SheetTitle className="text-white text-lg font-bold">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col mt-4">
          <Link 
            href="/"
            onClick={() => setOpen(false)}
            className="w-full text-center py-2.5 text-white/80 font-roboto text-sm
              hover:text-white transition-colors duration-200 border-b border-white/5
              hover:border-white/20"
          >
            Home
          </Link>
          
          <Link 
            href="/products"
            onClick={() => setOpen(false)}
            className="w-full text-center py-2.5 text-white/80 font-roboto text-sm
              hover:text-white transition-colors duration-200 border-b border-white/5
              hover:border-white/20"
          >
            Products
          </Link>
          
          <Link 
            href="/search"
            onClick={() => setOpen(false)}
            className="w-full text-center py-2.5 text-white/80 font-roboto text-sm
              hover:text-white transition-colors duration-200 border-b border-white/5
              hover:border-white/20 flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link 
                href="/orders"
                onClick={() => setOpen(false)}
                className="w-full text-center py-2.5 text-white/80 font-roboto text-sm
                  hover:text-white transition-colors duration-200 border-b border-white/5
                  hover:border-white/20 flex items-center justify-center gap-2"
              >
                <Package className="h-4 w-4" />
                My Orders
              </Link>
              <form action={signOutAction} className="w-full h-2">
                <button 
                  type="submit"
                  className="w-full text-center py-2 text-red-400 font-roboto text-sm
                    hover:text-red-300 transition-colors duration-200
                    hover:border-white/20 flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link 
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="w-full text-center py-2.5 text-white/80 font-roboto text-sm
                  hover:text-white transition-colors duration-200 border-b border-white/5
                  hover:border-white/20"
              >
                Sign in
              </Link>
              <Link 
                href="auth/sign-up"
                onClick={() => setOpen(false)}
                className="w-full text-center py-2.5 text-white/80 font-roboto text-sm
                  hover:text-white transition-colors duration-200 border-b border-white/5
                  hover:border-white/20"
              >
                Sign up
              </Link>
            </>
          )}
          
          <div className="w-full flex justify-center mt-6 py-2.5 border-t border-white/5">
            <CurrencyIndicator variant="full" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 