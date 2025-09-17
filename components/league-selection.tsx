'use client'
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getLeagues } from "@/app/actions";
import { LeagueSkeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";




interface League {
  id: string;
  name: string;
  imageUrl: string;
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
  description?: string;
}

interface LeagueCardProps {
  league: League;
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
  isExpanded: boolean;
  onExpand: (id: string) => void;
}

const LeagueCard = ({ league, gameVersion, isExpanded, onExpand }: LeagueCardProps) => {
  const router = useRouter();


  
  // Also build product URLs with search params for direct prefetching
  const softcoreProductsUrl = `/products?gameVersion=${gameVersion}&league=${encodeURIComponent(league.name)}&difficulty=softcore`;
  const hardcoreProductsUrl = `/products?gameVersion=${gameVersion}&league=${encodeURIComponent(league.name)}&difficulty=hardcore`;

  // Prefetch the products pages when card is expanded
  useEffect(() => {
    if (isExpanded) {
      // Prefetch both difficulty product pages
      const prefetchSoftcore = async () => {
        await router.prefetch(softcoreProductsUrl);
      };
      
      const prefetchHardcore = async () => {
        await router.prefetch(hardcoreProductsUrl);
      };
      
      prefetchSoftcore();
      prefetchHardcore();
    }
  }, [isExpanded, router, softcoreProductsUrl, hardcoreProductsUrl]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onExpand(league.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        w-[380px] 
        h-[360px]
        transition-all 
        duration-300 
        ease-in-out 
        ${isExpanded ? 'scale-105' : 'hover:scale-102'}
        ${isExpanded ? 'cursor-default' : 'cursor-pointer'}
      `}
      onClick={() => onExpand(league.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-pressed={isExpanded}
      aria-label={`${league.name} league, click to expand options`}
    >
      <Card className="p-0 shadow-xl rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50">
        <CardContent className="p-0">
          <CardHeader>
            <div>
              <h2 className="text-center font-roboto font-black text-primary tracking-wide text-3xl">
                {league.name}
              </h2>
              {league.description && (
                <p className="text-center text-sm text-muted-foreground mt-1">
                  {league.description}
                </p>
              )}
            </div>
          </CardHeader>
          <div className="relative h-[300px] w-full">
            <Image
              src={league.imageUrl}
              alt={`${league.name} league image`}
              fill
              sizes="(max-width: 380px) 100vw, 380px"
              quality={90}
              className="object-cover object-center h-[300px] w-full rounded-t-lg p-4"
              priority
            />
          </div>
        </CardContent>

        {isExpanded && (
          <CardFooter className="flex justify-center gap-2 py-2 mb-4 bg-gradient-to-t from-card via-card/90 to-transparent">
            <Link
              href={softcoreProductsUrl}
              prefetch={true}
              onClick={(e) => {
                e.stopPropagation();
              }}
              aria-label={`Select ${league.name} softcore league`}
              className="w-32 bg-gradient-to-b from-emerald-600 to-emerald-700 text-white/90 font-bold px-4 py-2.5 rounded-lg hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 text-md tracking-wide shadow-sm hover:shadow-md flex items-center justify-center"
            >
              Softcore
            </Link>
            <Link
              href={hardcoreProductsUrl}
              prefetch={true}
              onClick={(e) => {
                e.stopPropagation();
              }}
              aria-label={`Select ${league.name} hardcore league`}
              className="w-32 bg-gradient-to-b from-rose-600 to-rose-700 text-white/90 font-bold px-4 py-2.5 rounded-lg hover:from-rose-500 hover:to-rose-600 transition-all duration-200 text-md tracking-wide shadow-sm hover:shadow-md flex items-center justify-center"
            >
              Hardcore
            </Link>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
};

interface LeagueSelectionProps {
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
}

export function LeagueSelectionPage({ gameVersion }: LeagueSelectionProps) {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLeagueId, setExpandedLeagueId] = useState<string | null>(null);
  const t = useTranslations("SelectLeaguePage");
  const isPoe2 = gameVersion === "path-of-exile-2";
  const gameTitle = isPoe2 ? "Path of Exile 2" : "Path of Exile";
  const patchVersion = gameVersion === "path-of-exile-2" ? "poe2" : "3.25";

  
  const handleExpand = (leagueId: string) => {
    setExpandedLeagueId(expandedLeagueId === leagueId ? null : leagueId);
  };

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        const data = await getLeagues(gameVersion);
        setLeagues(data);
      } catch (err) {
        setError('Failed to load leagues');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [gameVersion]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-start bg-background pt-12 px-4">
        <div className="max-w-7xl w-full flex flex-col items-center">
          <h2 className="text-5xl md:text-6xl text-center font-black font-source-sans bg-gradient-to-r from-[#DEDCFF] to-[#6f58ff] bg-clip-text text-transparent tracking-wider">
            SELECT YOUR LEAGUE
          </h2>
          <p className="text-sm text-center text-muted-foreground/80 mb-12 max-w-2xl tracking-wide">
            Select your Path of Exile league below to view available currency prices and offers.
          </p>
          <div className="flex flex-wrap justify-center gap-10">
            {[1, 2, 3, 4].map((item) => (
              <LeagueSkeleton key={item} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-start bg-background pt-6 px-4 ">
      <div className="max-w-7xl w-full flex flex-col items-center">
        <h1 className="text-5xl md:text-6xl text-center font-black font-source-sans bg-gradient-to-r from-[#DEDCFF] to-[#6f58ff] bg-clip-text text-transparent tracking-wider">
          {t("title")}
        </h1>
        <p className="text-sm text-center text-muted-foreground/80 mb-12 max-w-2xl tracking-wide">
          {t("description")}
        </p>
        <div className="flex flex-wrap justify-center gap-20 mb-20 md:gap-10 md:mb-30">
          {leagues.map((league) => (
            <LeagueCard
              key={league.id}
              league={league}
              gameVersion={gameVersion}
              isExpanded={expandedLeagueId === league.id}
              onExpand={handleExpand}
            />
          ))}
        </div>
      </div>
     
    </main>
  );
}