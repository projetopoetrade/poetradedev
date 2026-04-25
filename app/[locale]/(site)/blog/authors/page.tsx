import { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getAllAuthors, SanityAuthor } from "@/sanity/sanity-utils";
import { buildCanonical, buildAbsoluteUrl, getOgLocale } from "@/lib/utils";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";

export const revalidate = 300;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const canonical = buildCanonical("/blog/authors", locale);
  const siteName = "Path of Trade";
  const title = locale === "pt-br" ? "Autores | Path of Trade" : "Authors | Path of Trade";

  return {
    title,
    description: locale === "pt-br" 
      ? "Conheça os autores por trás dos artigos do Path of Trade"
      : "Meet the authors behind Path of Trade articles",
    alternates: {
      canonical,
      languages: {
        en: buildAbsoluteUrl("/blog/authors"),
        "pt-BR": buildAbsoluteUrl("/pt-br/blog/authors"),
        "x-default": buildAbsoluteUrl("/blog/authors"),
      },
    },
    openGraph: {
      title,
      description: locale === "pt-br"
        ? "Conheça os autores por trás dos artigos do Path of Trade"
        : "Meet the authors behind Path of Trade articles",
      url: canonical,
      type: "website",
      ...getOgLocale(locale),
      siteName,
    },
  };
}

export default async function AuthorsPage(props: PageProps) {
  const { locale } = await props.params;
  const authors = await getAllAuthors();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Breadcrumb
        items={[
          { label: locale === "pt-br" ? "Blog" : "Blog", href: "/blog" },
          { label: locale === "pt-br" ? "Autores" : "Authors" },
        ]}
      />

      <h1 className="text-3xl md:text-4xl font-bold mb-4">
        {locale === "pt-br" ? "Nossos Autores" : "Our Authors"}
      </h1>
      <p className="text-muted-foreground mb-8">
        {locale === "pt-br" 
          ? "Conheça a equipe de escritores por trás dos guias e artigos do Path of Trade"
          : "Meet the team of writers behind Path of Trade guides and articles"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {authors.map((author: SanityAuthor) => (
          <Link
            key={author._id}
            href={`/blog/author/${author.slug}`}
            className="group flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors no-underline"
          >
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted shrink-0">
              {author.image && typeof author.image === "string" && author.image.trim() !== "" ? (
                <Image
                  src={author.image}
                  alt={author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {author.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                {author.name}
              </h2>
              {author.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {author.bio}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {authors.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          {locale === "pt-br" ? "Nenhum autor encontrado." : "No authors found."}
        </p>
      )}
    </div>
  );
}
