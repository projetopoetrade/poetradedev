import { PageProps } from "@/lib/interface";
import Products from "@/components/products";
import { Metadata } from "next";


export async function generateMetadata(
  props: { 
    params: Promise<{ 
      gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
      league: string;
      difficulty: string;
    }> 
  }
): Promise<Metadata> {
  const params = await props.params;
  const decodedLeague = decodeURIComponent(params.league);

  return {
    title: `${decodedLeague} Currency Trading - ${params.difficulty} League | PathofTrade.net`,
    description: `Buy ${decodedLeague} POE Currency for ${params.difficulty} League. Best prices for Exalted Orbs, Chaos Orbs, Divine Orbs in Path of Exile ${params.gameVersion === 'path-of-exile-1' ? '1' : '2'}. Instant delivery & 24/7 support.`,
    openGraph: {
      title: `POE ${decodedLeague} Currency - ${params.difficulty} Marketplace | PathofTrade.net`,
      description: `Safe ${decodedLeague} currsency exchange for ${params.difficulty} League. Trade Chaos/Exalted Orbs, Divine Orbs, and more in POE ${params.gameVersion === 'path-of-exile-1' ? '1' : '2'} with real-time stock.`,
      type: "website",
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
