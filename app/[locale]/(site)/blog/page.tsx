import { getPosts } from "@/sanity/sanity-utils";
import BlogItem from "@/components/Blog";
import { Blog } from "@/types/blog";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}



export default async function Home(props: PageProps) {
  const params = await props.params;

  const {
    locale
  } = params;

  try {
    const posts = await getPosts(locale);
    
    if (!posts) {
      return <div className="py-5">Loading...</div>;
    }

    return (
      <div className="py-5">
        {posts?.length > 0 ? (
          posts.map((post: Blog) => (
            <BlogItem 
              key={`${post._id}-${post.slug.current}`} 
              blog={post}
              locale={locale}
            />
          ))
        ) : (
          <p>No posts found</p>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error fetching posts:', error);
    return <div className="py-5">Error loading posts. Please try again later.</div>;
  }
}