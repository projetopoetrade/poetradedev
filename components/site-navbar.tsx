// components/site-navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import CartDropdown from '@/components/cart-dropdown';
import HeaderAuth from '@/components/header-auth';

type Props = { locale?: string };

export function SiteNavbar({ locale }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Pular para conteúdo
      </a>

      <nav
        aria-label="Principal"
        className={[
          'w-full fixed top-0 left-0 right-0 z-50 h-16',
          'backdrop-blur-xl bg-background/60 supports-[backdrop-filter]:bg-background/60',
          'border-b border-border/50',
          scrolled ? 'shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_10px_20px_-15px_rgba(0,0,0,0.5)]' : '',
        ].join(' ')}
      >
        <div className="mx-auto w-full max-w-6xl h-full px-4 flex items-center justify-between">
          {/* Mobile: botão menu */}
          <div className="flex flex-1 items-center">
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground/80 hover:text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Abrir menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Centro: logo */}
          <div className="flex flex-1 justify-center">
            <Link href="/" className="py-2 inline-flex items-center focus:outline-none focus:ring-2 focus:ring-primary rounded-md">
              <Image
                src="/images/logo.webp"
                alt="Path of Trade"
                width={120}
                height={40}
                // Deixe priority aqui apenas se for LCP crítico nesta rota
                priority
                sizes="(max-width: 768px) 120px, 140px"
                quality={90}
              />
            </Link>
          </div>

          {/* Direita: ações */}
          <div className="flex flex-1 justify-end items-center gap-3">
            <CartDropdown />
            <div className="hidden md:flex items-center gap-3">
              <HeaderAuth />
            </div>
            <div className="md:hidden flex items-center">
              <HeaderAuth />
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          hidden={!mobileOpen}
          className="md:hidden border-t border-border/60 bg-background/90 backdrop-blur"
        >
          <ul className="px-4 py-3 space-y-1">
            <li>
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-2 py-2 text-foreground/90 hover:text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Início
              </Link>
            </li>
            {/* Adicione itens conforme necessário, ex.: Produtos, Ligas, Suporte */}
          </ul>
        </div>
      </nav>
    </>
  );
}
