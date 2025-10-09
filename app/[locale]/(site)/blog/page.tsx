import { getPosts, getPostsCount } from "@/sanity/sanity-utils";
import BlogItem from "@/components/Blog";
import { Blog } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import BlogPagination from "@/components/Blog/BlogPagination";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

const POSTS_PER_PAGE = 5; // Reduced for testing - change to 10 or more for production

export default async function BlogPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { locale } = params;
  const currentPage = Number(searchParams.page) || 1;

  try {
    const [posts, totalPosts] = await Promise.all([
      getPosts(locale, currentPage, POSTS_PER_PAGE),
      getPostsCount(locale)
    ]);
    
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
    
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
            {totalPosts > 0 && (
              <div className="text-sm text-muted-foreground mt-4 space-y-1">
                <p>
                  Showing {((currentPage - 1) * POSTS_PER_PAGE) + 1} - {Math.min(currentPage * POSTS_PER_PAGE, totalPosts)} of {totalPosts} posts
                </p>
                <p className="text-xs opacity-70">
                  Page {currentPage} of {totalPages} | Posts per page: {POSTS_PER_PAGE}
                </p>
              </div>
            )}
          </div>

          {posts?.length > 0 ? (
            <>
              <div className="space-y-6">
                {posts.map((post: Blog) => (
                  <BlogItem 
                    key={`${post._id}-${post.slug.current}`} 
                    blog={post}
                    locale={locale}
                  />
                ))}
              </div>
              
              <BlogPagination 
                currentPage={currentPage}
                totalPages={totalPages}
                locale={locale}
              />
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No posts found</p>
            </div>
          )}
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