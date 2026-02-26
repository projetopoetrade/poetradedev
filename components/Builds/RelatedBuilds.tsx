import type { Build } from "@/lib/interface";
import Link from "next/link";
import AscendancyImage from "./AscendancyImage";

interface RelatedBuildsProps {
  builds: Build[];
  locale: string;
}

export default function RelatedBuilds({ builds, locale }: RelatedBuildsProps) {
  if (!builds.length) return null;

  const base = locale === "pt-br" ? "/pt-br" : "";

  return (
    <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Related Builds
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {builds.map((build) => (
          <Link
            key={build.id}
            href={`${base}/builds/${build.slug}`}
            className="group block no-underline"
          >
            <article className="rounded-lg overflow-hidden bg-gray-900/30 dark:bg-black/20 border border-gray-800/50 hover:border-gray-500/50 transition-all duration-300">
              <div className="relative w-full h-40 overflow-hidden">
                <AscendancyImage
                  ascendancy={build.ascendancy}
                  imageUrl={build.image_url}
                  alt={build.title}
                  gameVersion={build.game_version}
                  variant="icon"
                  fill
                  className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-xs text-amber-400 font-medium">
                    {build.class} · {build.ascendancy}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1 text-white group-hover:text-gray-200 transition-colors line-clamp-2">
                  {build.title}
                </h3>
                {build.description && (
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {build.description}
                  </p>
                )}
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
