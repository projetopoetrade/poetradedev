// components/AuthButton.tsx
import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CurrencyIndicator } from "./currency-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MobileMenu } from "./mobile-menu";
import { Package, LogOut } from "lucide-react";
import LocaleSwitcher from "./locale-switcher";
import { Separator } from "./ui/separator";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Your fallback for missing env vars is good, no changes needed here.
  if (!hasEnvVars) {
    // ... same as your original code
  }

  return user ? (
    // Authenticated User View
    <div className="flex items-center gap-4 pr-2">
      {/* --- Desktop View (hidden below md) --- */}
      <div className="hidden md:flex items-center gap-4">
        <CurrencyIndicator variant="full" />
        <LocaleSwitcher />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel className="font-roboto text-sm font-bold">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/orders" className="flex items-center justify-between w-full cursor-pointer">
                  <span className="font-roboto text-sm font-medium">My Orders</span>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10 p-0">
                <button type="submit" className="w-full text-left flex items-center justify-between p-2 cursor-pointer">
                  <span>Log out</span>
                  <LogOut className="h-4 w-4" />
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* --- Mobile View (visible below md) --- */}
      <MobileMenu>
        <div className="flex flex-col gap-5 pt-6">
          {/* User Info */}
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Account</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
          <Separator />
          {/* Links */}
          <Link href="/orders" className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-accent rounded-md">
            My Orders
            <Package className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Separator />
          {/* Controls */}
          <div className="flex items-center justify-between px-2">
            <span className="text-sm">Language</span>
            <LocaleSwitcher />
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-sm">Currency</span>
            <CurrencyIndicator variant="full" />
          </div>
          <Separator />
          {/* Sign Out */}
          <form action={signOutAction} className="w-full">
            <Button type="submit" variant="ghost" className="w-full justify-between text-red-500 hover:text-red-500 hover:bg-red-500/10">
              Log out <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </MobileMenu>
    </div>
  ) : (
    // Unauthenticated User View
    <div className="flex items-center gap-3 pr-2">
      {/* --- Desktop View (hidden below md) --- */}
      <div className="hidden md:flex items-center gap-3">
        <CurrencyIndicator variant="full" />
        <LocaleSwitcher />
        <Button asChild size="sm" variant="outline">
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>

      {/* --- Mobile View (visible below md) --- */}
      <MobileMenu>
        <div className="flex flex-col gap-4 pt-6">
          <Button asChild className="w-full">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
          <Separator className="my-4" />
          <div className="flex items-center justify-between px-2">
            <span className="text-sm">Language</span>
            <LocaleSwitcher />
          </div>
          <div className="flex items-center justify-between px-2">
            <span className="text-sm">Currency</span>
            <CurrencyIndicator variant="full" />
          </div>
        </div>
      </MobileMenu>
    </div>
  );
}