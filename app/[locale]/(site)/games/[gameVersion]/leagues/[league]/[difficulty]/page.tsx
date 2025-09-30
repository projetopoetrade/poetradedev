import { PageProps } from "@/lib/interface";
import Products from "@/components/products";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical } from "@/lib/utils";


export async function generateMetadata(
  props: { 
    params: Promise<{ 
      gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
      league: string;
      difficulty: string;
      locale: string;
    }> 
  }
): Promise<Metadata> {
  const params = await props.params;
  const decodedLeague = decodeURIComponent(params.league);
  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });

  const poeVersion = params.gameVersion === 'path-of-exile-1' ? '1' : '2';
  const title = t('league.title', { league: decodedLeague, difficulty: params.difficulty });
  const description = t('league.description', { league: decodedLeague, difficulty: params.difficulty, poeVersion });
  const ogTitle = t('league.ogTitle', { league: decodedLeague, difficulty: params.difficulty });
  const ogDescription = t('league.ogDescription', { league: decodedLeague, difficulty: params.difficulty, poeVersion });
  const canonical = buildCanonical(`/${params.locale}/games/${params.gameVersion}/leagues/${encodeURIComponent(params.league)}/${encodeURIComponent(params.difficulty)}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: "website",
      siteName: t("siteName"),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
    },
  };
}

export default async function Page(
  props: { 
    params: Promise<{ 
      gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
      league: string;
      difficulty: string;
    }> 
  }
) {
  const params = await props.params;
  try {
    const { gameVersion, league, difficulty } = params;
    const decodedLeague = decodeURIComponent(league);

    return (
      <main className="container min-h-screen mx-auto pt-10">
        <div className="bg-indigo-700 inline-block min-w-[320px] md:min-w-[320px] rounded-tl-md rounded-tr-sm px-4 py-2 shadow-lg">
          <h2 className="text-lg md:text-3xl text-center text-white font-bold antialiased capitalize tracking-wide">
            {decodedLeague} - {difficulty}
          </h2>
        </div>

        <Products params={{ gameVersion, league: decodedLeague, difficulty }} />
        

      </main>
    );
  } catch (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading page: {(error as Error).message}
      </div>
    );
  }
}
