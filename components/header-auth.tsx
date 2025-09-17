import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { DropdownSettingsItem } from "./dropdown-settings-item";
import { CurrencyIndicator } from "./currency-indicator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MobileMenu } from "./mobile-menu";
import { Settings, Package, User, LogOut } from "lucide-react";
import LocaleSwitcher from "./locale-switcher";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!hasEnvVars) {
    return (
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            disabled
            className="w-24 h-9 opacity-75 cursor-none pointer-events-none"
          >
            <Link href="auth/login">Sign in</Link>
          </Button>
          <Button
            asChild
            size="sm"
            variant="default"
            disabled
            className="w-24 h-9 opacity-75 cursor-none pointer-events-none"
          >
            <Link href="auth/sign-up">Sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-4 pr-2">
      <div className="hidden sm:block">
        <CurrencyIndicator variant="full" />
      </div>
      <div className="sm:hidden">
        <CurrencyIndicator variant="icon" />
      </div>
      <LocaleSwitcher />
      <div className="hidden md:block">
   
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel className="font-roboto text-sm font-bold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/orders" className="flex items-center justify-between w-full">
                  <span className="font-roboto text-sm font-medium">My Orders</span>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                <button type="submit" className="w-full text-left flex items-center justify-between">
                  <span>Log out</span>
                  <LogOut className="h-4 w-4" />
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
        
      </div>
   
      <div className="block md:hidden">
        <MobileMenu isAuthenticated={true} />
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-2 sm:gap-3 justify-end pr-2">
      <div className="sm:hidden">
        <CurrencyIndicator variant="icon" />
      </div>
      <div className="hidden sm:block">
        <CurrencyIndicator variant="full" />
      </div>
      <LocaleSwitcher />
      <div className="hidden md:flex gap-2 sm:gap-3">

        
        <Button
          asChild
          size="sm"
          className="text-white w-20 sm:w-24 font-roboto text-sm font-bold bg-black 
            hover:bg-slate-100 hover:text-black transition-all duration-300 
            hover:scale-102 rounded-md border hover:border-black"
        >
          <Link href="/auth/login">Sign in</Link>
        </Button>

        <Button
          asChild
          size="sm"
          className="text-white font-roboto text-sm font-bold bg-black 
            hover:bg-slate-100 hover:text-black transition-all duration-300 
            hover:scale-102 rounded-md border hover:border-black"
        >
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
      <div className="block md:hidden">
        <MobileMenu isAuthenticated={false} />
      </div>
    </div>
  );
}
