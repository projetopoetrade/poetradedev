// components/header-auth.tsx
// Desktop-only auth UI — mobile auth is handled by MobileAuthSection inside SiteNavbar.

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
import { Package, LogOut } from "lucide-react";
import LocaleSwitcher from "./locale-switcher";

export default async function HeaderAuth() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return null;
  }

  return user ? (
    <div className="flex items-center gap-3">
      <CurrencyIndicator variant="full" />
      <LocaleSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>
              {user.email?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="text-sm font-bold">
            My Account
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link
                href="/orders"
                className="flex items-center justify-between w-full cursor-pointer"
              >
                <span className="text-sm font-medium">My Orders</span>
                <Package className="h-4 w-4 text-muted-foreground" />
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <form action={signOutAction}>
            <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10 p-0">
              <button
                type="submit"
                className="w-full text-left flex items-center justify-between p-2 cursor-pointer"
              >
                <span>Log out</span>
                <LogOut className="h-4 w-4" />
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <CurrencyIndicator variant="full" />
      <LocaleSwitcher />
      <Button asChild size="sm" variant="outline">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
