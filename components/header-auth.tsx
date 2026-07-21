// components/header-auth.tsx
// Desktop-only auth UI — mobile auth is handled by MobileAuthSection inside SiteNavbar.
//
// Client Component de propósito. Como Server Component async ele chamava
// `cookies()` + `supabase.auth.getUser()`, e por estar na navbar do layout isso
// (a) tornava TODAS as rotas dinâmicas, anulando os `revalidate` do site inteiro,
// e (b) adicionava um round-trip de rede ao Supabase em toda requisição,
// inclusive de visitante anônimo. Estado de login é por usuário: não pertence
// ao HTML estático servido pela CDN.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/client";
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

export default function HeaderAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!hasEnvVars) return;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setResolved(true);
    });

    // Mantém a navbar em sincronia com login/logout feitos em outra aba ou
    // por outro componente, sem recarregar a página.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setResolved(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  if (!hasEnvVars) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <CurrencyIndicator variant="full" />
      <LocaleSwitcher />

      {/* Antes do primeiro resolve, reserva a largura dos dois botões de auth
          para a navbar não pular quando o estado chegar. */}
      {!resolved ? (
        <div aria-hidden className="h-9 w-[8.5rem]" />
      ) : user ? (
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
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 focus:bg-red-500/10 p-0"
              onSelect={(e) => {
                e.preventDefault();
                void handleSignOut();
              }}
            >
              <button
                type="button"
                className="w-full text-left flex items-center justify-between p-2 cursor-pointer"
              >
                <span>Log out</span>
                <LogOut className="h-4 w-4" />
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button asChild size="sm" variant="outline">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/sign-up">Sign up</Link>
          </Button>
        </>
      )}
    </div>
  );
}
