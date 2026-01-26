import { PageProps } from "@/lib/interface";
import Products from "@/components/products";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildCanonical, generateKeywords } from "@/lib/utils";


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
  
  // 1. Definição das URLs
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net";
  
  // Caminho base sem locale (ex: /games/path-of-exile-1/leagues/Standard/softcore)
  // Nota: encodeURIComponent é vital aqui para ligas com espaços
  const pathWithoutLocale = `/games/${params.gameVersion}/leagues/${encodeURIComponent(params.league)}/${encodeURIComponent(params.difficulty)}`;

  // URLs completas para cada idioma
  const enUrl = `${baseUrl}${pathWithoutLocale}`; // Assumindo que EN não tem prefixo /en
  const ptUrl = `${baseUrl}/pt-br${pathWithoutLocale}`;
  
  // Canonical Auto-referenciada (aponta para a própria página atual)
  const canonical = params.locale === 'en' ? enUrl : ptUrl;

  return {
    title,
    description,
    alternates: { 
      canonical,
      // 2. Hreflangs: O "pulo do gato" para o Google indexar o PT-BR
      languages: {
        'en': enUrl,
        'pt-BR': ptUrl,
        'x-default': enUrl,
      }
    },
    openGraph: {
      title: t('league.ogTitle', { league: decodedLeague, difficulty: params.difficulty }),
      description: t('league.ogDescription', { league: decodedLeague, difficulty: params.difficulty, poeVersion }),
      url: canonical,
      type: "website",
      siteName: t("siteName"),
    },
    twitter: {
      card: "summary_large_image",
      title: t('league.ogTitle', { league: decodedLeague, difficulty: params.difficulty }),
      description: t('league.ogDescription', { league: decodedLeague, difficulty: params.difficulty, poeVersion }),
    },
    keywords: generateKeywords({
      locale: params.locale,
      gameVersion: params.gameVersion,
      league: decodedLeague,
      difficulty: params.difficulty as 'softcore' | 'hardcore',
      customKeywords: ['buy currency', 'poe items', 'trading']
    })
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
