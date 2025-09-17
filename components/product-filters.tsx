"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getLeagues } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProductFiltersProps {
  currentGameVersion: string;
  currentLeague: string;
  currentDifficulty: string;
}

interface League {
  id: string;
  name: string;
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
}

export default function ProductFilters({
  currentGameVersion,
  currentLeague,
  currentDifficulty,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Products');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);

  const gameVersions = [
    { value: "Current", label: "Current Version" },
    { value: "path-of-exile-1", label: "Path of Exile 1" },
    { value: "path-of-exile-2", label: "Path of Exile 2" },
  ];

  const difficulties = [
    "softcore",
    "hardcore",
  ];

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLoading(true);
        const gameVersion = currentGameVersion === "Current" ? "path-of-exile-1" : currentGameVersion as 'path-of-exile-1' | 'path-of-exile-2';
        const leaguesData = await getLeagues(gameVersion);
        setLeagues(leaguesData);
      } catch (error) {
        console.error('Error fetching leagues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeagues();
  }, [currentGameVersion]);

  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "Current" && type === "gameVersion") {
      params.delete("gameVersion");
    } else if (value === "All Leagues" && type === "league") {
      params.delete("league");
    } else if (value === "All Difficulties" && type === "difficulty") {
      params.delete("difficulty");
    } else {
      params.set(type, value);
    }
    setLoading(false);

    router.push(`/products?${params.toString()}`);
  };

  if (loading) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" />
            {t("filters")}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("filters")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-4 p-4">
            <div className="flex-1 min-w-[200px] animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="flex-1 min-w-[200px] animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="flex-1 min-w-[200px] animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Filter className="mr-2 h-4 w-4" />
          {t("filters")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("filters")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              {t("gameVersion")}
            </label>
            <Select
              value={currentGameVersion}
              onValueChange={(value) => handleFilterChange("gameVersion", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectGameVersion")} />
              </SelectTrigger>
              <SelectContent>
                {gameVersions.map((version) => (
                  <SelectItem key={version.value} value={version.value}>
                    {version.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              {t("league")}
            </label>
            <Select
              value={currentLeague}
              onValueChange={(value) => handleFilterChange("league", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectLeague")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Leagues">{t("allLeagues")}</SelectItem>
                {leagues.map((league) => (
                  <SelectItem key={league.id} value={league.name}>
                    {league.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">
              {t("difficulty")}
            </label>
            <Select
              value={currentDifficulty}
              onValueChange={(value) => handleFilterChange("difficulty", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectDifficulty")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Difficulties">{t("allDifficulties")}</SelectItem>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 