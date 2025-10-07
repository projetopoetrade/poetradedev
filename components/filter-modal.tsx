"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trophy, Shield, Sword, Loader2 } from "lucide-react";
import { getLeagues } from "@/app/actions";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface League {
  id: string;
  name: string;
  gameVersion: 'path-of-exile-1' | 'path-of-exile-2';
  isActive: boolean;
}

export function FilterModal({ open, onOpenChange }: FilterModalProps) {
  const t = useTranslations('Products');
  const router = useRouter();
  const [selectedGameVersion, setSelectedGameVersion] = useState<string>("");
  const [selectedLeague, setSelectedLeague] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loadingLeagues, setLoadingLeagues] = useState(false);

  const gameVersions = [
    { value: "path-of-exile-1", label: "Path of Exile 1" },
    { value: "path-of-exile-2", label: "Path of Exile 2" },
  ];

  const difficulties = [
    { value: "softcore", label: "Softcore", icon: Shield },
    { value: "hardcore", label: "Hardcore", icon: Sword },
  ];

  // Fetch leagues when game version changes
  useEffect(() => {
    if (selectedGameVersion) {
      setLoadingLeagues(true);
      setSelectedLeague(""); // Reset league selection
      
      getLeagues(selectedGameVersion as 'path-of-exile-1' | 'path-of-exile-2')
        .then((data) => {
          setLeagues(data || []);
        })
        .catch((error) => {
          console.error('Error fetching leagues:', error);
          setLeagues([]);
        })
        .finally(() => {
          setLoadingLeagues(false);
        });
    } else {
      setLeagues([]);
    }
  }, [selectedGameVersion]);

  const handleApplyFilters = () => {
    if (selectedGameVersion && selectedLeague && selectedDifficulty) {
      const params = new URLSearchParams();
      params.set("gameVersion", selectedGameVersion);
      params.set("league", selectedLeague);
      params.set("difficulty", selectedDifficulty);
      
      router.push(`/products?${params.toString()}`);
      onOpenChange(false);
    }
  };

  const isFormValid = selectedGameVersion && selectedLeague && selectedDifficulty;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {t('selectFilters')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('selectFiltersDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Game Version Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{t('gameVersion')}</h3>
            <div className="grid grid-cols-1 gap-3">
              {gameVersions.map((version) => (
                <Button
                  key={version.value}
                  variant={selectedGameVersion === version.value ? "default" : "outline"}
                  className="justify-start h-12"
                  onClick={() => setSelectedGameVersion(version.value)}
                >
                  {version.label}
                </Button>
              ))}
            </div>
          </div>

          {/* League Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {t('league')}
            </h3>
            {!selectedGameVersion ? (
              <p className="text-sm text-muted-foreground">
                Please select a game version first
              </p>
            ) : loadingLeagues ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Loading leagues...</span>
              </div>
            ) : leagues.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No leagues available for this game version
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {leagues.map((league) => (
                  <Button
                    key={league.id}
                    variant={selectedLeague === league.name ? "default" : "outline"}
                    className="h-10 text-sm"
                    onClick={() => setSelectedLeague(league.name)}
                  >
                    {league.name}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{t('difficulty')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {difficulties.map((difficulty) => {
                const IconComponent = difficulty.icon;
                return (
                  <Button
                    key={difficulty.value}
                    variant={selectedDifficulty === difficulty.value ? "default" : "outline"}
                    className="h-12"
                    onClick={() => setSelectedDifficulty(difficulty.value)}
                  >
                    <IconComponent className="h-5 w-5 mr-2" />
                    {difficulty.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleApplyFilters}
            disabled={!isFormValid}
            className="flex-1"
          >
            {t('applyFilters')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
