"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import BlogItem from "@/components/Blog";
import BlogPagination from "@/components/Blog/BlogPagination";
import { Blog } from "@/types/blog";

interface BlogListClientProps {
  posts: Blog[];
  locale: string;
  perPage: number;
}

/**
 * Paginacao em memoria. A rota do blog lia `?page=` no servidor, o que a tornava
 * dinamica — uma execucao de funcao por pagina, por locale. Como sao ~17 posts
 * por idioma, a listagem inteira cabe no payload estatico e a troca de pagina
 * vira uma fatia de array.
 *
 * A descoberta pelo Google nao depende disto: todos os posts estao no sitemap
 * individualmente, e nenhuma URL `?page=` esta la.
 */
export default function BlogListClient(props: BlogListClientProps) {
  return (
    <Suspense fallback={<BlogListInner {...props} initialPage={1} />}>
      <BlogListWithPage {...props} />
    </Suspense>
  );
}

function BlogListWithPage(props: BlogListClientProps) {
  const searchParams = useSearchParams();
  const fromUrl = Number(searchParams.get("page")) || 1;

  return <BlogListInner {...props} initialPage={fromUrl} />;
}

function BlogListInner({
  posts,
  locale,
  perPage,
  initialPage,
}: BlogListClientProps & { initialPage: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage));
  const [page, setPage] = useState(Math.min(Math.max(1, initialPage), totalPages));

  // Mantem `?page=` na URL para que a posicao continue compartilhavel, sem
  // custo de servidor. `replace` evita empilhar historico; a pagina 1 fica com
  // a URL limpa, que e a canonica.
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    const target = page > 1 ? String(page) : null;

    if ((current.get("page") ?? null) === target) return;

    if (target) current.set("page", target);
    else current.delete("page");

    const qs = current.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [page, pathname, router]);

  const start = (page - 1) * perPage;
  const visible = posts.slice(start, start + perPage);

  if (posts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">No posts found</p>
      </div>
    );
  }

  return (
    <>
      <div className="text-sm text-muted-foreground mb-4 space-y-1">
        <p>
          Showing {start + 1} - {Math.min(start + perPage, posts.length)} of{" "}
          {posts.length} posts
        </p>
        <p className="text-xs opacity-70">
          Page {page} of {totalPages} | Posts per page: {perPage}
        </p>
      </div>

      <div className="space-y-6">
        {visible.map((post, i) => (
          <BlogItem
            key={`${post._id}-${post.slug.current}`}
            blog={post}
            locale={locale}
            priority={page === 1 && i === 0}
          />
        ))}
      </div>

      <BlogPagination
        currentPage={page}
        totalPages={totalPages}
        locale={locale}
        onPageChange={setPage}
      />
    </>
  );
}
