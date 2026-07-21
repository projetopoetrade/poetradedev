import { getPosts } from "@/sanity/sanity-utils";
import { Blog } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import BlogListClient from "@/components/Blog/BlogListClient";
import { Metadata } from "next";
import { buildCanonical } from "@/lib/utils";

// ISR: revalidate cache every 5 minutes
export const revalidate = 300;

interface MetadataProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata(props: MetadataProps): Promise<Metadata> {
  const { locale } = await props.params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pathoftrade.net';

  const titles: Record<string, string> = {
    en: 'Path of Exile Blog — Guides, Tips & Currency News | Path of Trade',
    'pt-br': 'Blog Path of Exile — Guias, Dicas e Notícias de Moedas | Path of Trade',
  };
  const descriptions: Record<string, string> = {
    en: 'Stay up to date with the latest Path of Exile guides, currency tips, patch notes and trading news from Path of Trade.',
    'pt-br': 'Fique por dentro dos últimos guias, dicas de moedas, notas de patch e notícias de trading do Path of Exile.',
  };

  const title = titles[locale] ?? titles.en;
  const description = descriptions[locale] ?? descriptions.en;

  const enUrl = `${baseUrl}/blog`;
  const ptUrl = `${baseUrl}/pt-br/blog`;
  const canonicalUrl = locale === 'en' ? enUrl : ptUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': enUrl,
        'pt-BR': ptUrl,
        'x-default': enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      locale: locale === 'pt-br' ? 'pt_BR' : 'en_US',
      alternateLocale: locale === 'pt-br' ? ['en_US'] : ['pt_BR'],
      siteName: 'Path of Trade',
      images: [{ url: "/images/logo.webp" }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ["/images/logo.webp"],
    },
  };
}

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

const POSTS_PER_PAGE = 5; // Reduced for testing - change to 10 or more for production

// Teto para "traga todos" numa query so — a paginacao acontece no cliente.
const ALL_POSTS_PAGE_SIZE = 500;

// Nao le `?page=`: a paginacao passou a ser em memoria (BlogListClient). Ler
// searchParams aqui tornava a rota dinamica — uma execucao de funcao por pagina
// e por locale. Nenhuma URL `?page=` esta no sitemap; os posts sao descobertos
// individualmente, entao a mudanca nao afeta indexacao.
export default async function BlogPage(props: PageProps) {
  const params = await props.params;
  const { locale } = params;

  try {
    // Busca a listagem completa (~17 posts por idioma) numa unica query.
    const posts = await getPosts(locale, 1, ALL_POSTS_PAGE_SIZE);

    if (!posts) {
      return (
        <main className="container mx-auto px-4 py-8 min-h-screen">
          <Button variant="ghost" className="mb-6" asChild>
            <Link href="/" aria-label="Back to Home">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      );
    }

    // Structured data for the blog listing
    const blogStructuredData = {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Path of Exile Blog - Path of Trade",
      description: "Stay updated with the latest Path of Exile news, guides, and trading tips",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${locale === 'en' ? '' : `/${locale}`}/blog`,
      inLanguage: locale === 'pt-br' ? 'pt-BR' : 'en-US',
      publisher: {
        "@type": "Organization",
        name: "Path of Trade",
        logo: {
          "@type": "ImageObject",
          url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}/logo.png`
        }
      },
      blogPost: posts.map((post: Blog) => ({
        "@type": "BlogPosting",
        headline: post.title,
        description: post.metadata,
        image: post.mainImage || undefined,
        datePublished: post.publishedAt,
        author: {
          "@type": "Person",
          name: post.author.name
        },
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"}${locale === 'en' ? '' : `/${locale}`}/blog/${post.slug.current}`
      }))
    };

    return (
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogStructuredData) }}
        />
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/" aria-label="Back to Home">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Blog Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Path of Exile Blog
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Stay updated with the latest Path of Exile news, guides, and trading tips
            </p>
          </div>

          <BlogListClient
            posts={posts}
            locale={locale}
            perPage={POSTS_PER_PAGE}
          />
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching posts:', error);
    return (
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <Button variant="ghost" className="mb-6" asChild>
          <Link href="/" aria-label="Back to Home">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Error loading posts. Please try again later.</p>
        </div>
      </main>
    );
  }
}