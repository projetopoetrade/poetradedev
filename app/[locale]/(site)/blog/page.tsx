import { getPosts } from "@/sanity/sanity-utils";
import BlogItem from "@/components/Blog";
import { Blog } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function BlogPage(props: PageProps) {
  const params = await props.params;
  const { locale } = params;

  try {
    const posts = await getPosts(locale);
    
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

    return (
      <main className="container mx-auto px-4 py-8 min-h-screen">
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

          {posts?.length > 0 ? (
            posts.map((post: Blog) => (
              <BlogItem 
                key={`${post._id}-${post.slug.current}`} 
                blog={post}
                locale={locale}
              />
            ))
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