import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, ShoppingBag, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-12 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      {/* Main content */}
      <div className="space-y-6 mb-14">
        <p className="text-8xl md:text-9xl font-bold text-muted-foreground/10 leading-none select-none">
          404
        </p>
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Page not found</h1>
          <p className="text-muted-foreground max-w-md">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Try browsing one of the sections below.
          </p>
        </div>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <Link
          href="/games/path-of-exile-2/currency"
          className="group flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/30 transition-all"
        >
          <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-0.5">Path of Exile 2</p>
            <p className="text-xs text-muted-foreground">Currency, items and services for PoE 2</p>
          </div>
        </Link>

        <Link
          href="/games/path-of-exile-1/currency"
          className="group flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/30 transition-all"
        >
          <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-0.5">Path of Exile 1</p>
            <p className="text-xs text-muted-foreground">Currency, items and services for PoE 1</p>
          </div>
        </Link>

        <Link
          href="/products"
          className="group flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/30 transition-all"
        >
          <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-0.5">Browse Products</p>
            <p className="text-xs text-muted-foreground">Search all available products</p>
          </div>
        </Link>

        <Link
          href="/blog"
          className="group flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/30 transition-all"
        >
          <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-0.5">Blog & Guides</p>
            <p className="text-xs text-muted-foreground">PoE tips, builds and news</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
