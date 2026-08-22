"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

/**
 * Seletores de versão do jogo / liga / dificuldade da página de produto.
 *
 * Liga e dificuldade são **controlados**: trocar não navega, só troca a variante
 * já carregada (ver `ProductVariantProvider`). Antes cada troca disparava
 * `router.push('/products/<nome>?league=...')`, que caía num
 * `permanentRedirect` para a URL canônica sem a query — ou seja, o dropdown
 * navegava e não mudava nada. Também era o que tornava a rota dinâmica.
 *
 * Versão do jogo continua sendo navegação de verdade: é outro segmento de path
 * (`/games/<versão>/products/<slug>`), outra página estática. Só são oferecidas
 * as versões em que este `url_slug` existe — mandar o usuário para um 404 seria
 * pior que esconder a opção.
 */
interface FiltersProps {
  gameVersionOptions: { value: string; label: string }[];
  leagueOptions: string[];
  difficultyOptions: string[];
  currentGameVersion: "path-of-exile-1" | "path-of-exile-2";
  currentLeague: string;
  currentDifficulty: string;
  onLeagueChange?: (league: string) => void;
  onDifficultyChange?: (difficulty: string) => void;
  /** `url_slug` canônico, para a navegação entre versões do jogo. */
  urlSlug?: string;
  locale?: string;
}

export default function Filters({
  gameVersionOptions,
  leagueOptions,
  difficultyOptions,
  currentGameVersion,
  currentLeague,
  currentDifficulty,
  onLeagueChange,
  onDifficultyChange,
  urlSlug,
  locale,
}: FiltersProps) {
  const router = useRouter();

  const handleGameVersionChange = (value: string) => {
    if (value === currentGameVersion || !urlSlug) return;
    const prefix = !locale || locale === "en" ? "" : `/${locale}`;
    router.push(`${prefix}/games/${value}/products/${urlSlug}`);
  };

  // Os três selects continuam visíveis mesmo quando têm uma opção só — a
  // dimensão existe no produto e some-la esconderia informação. O que muda é
  // que ficam desabilitados em vez de fingir que navegam para algum lugar:
  // hoje o catálogo é todo PoE 1 / softcore, então esses dois são fixos.
  const canChangeGameVersion = gameVersionOptions.length > 1 && Boolean(urlSlug);
  const canChangeLeague = leagueOptions.length > 1;
  const canChangeDifficulty = difficultyOptions.length > 1;

  return (
    <div className="space-y-4 my-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="gameVersion" className="text-sm font-medium">
            Game Version
          </label>
          <Select
            value={currentGameVersion}
            onValueChange={handleGameVersionChange}
            disabled={!canChangeGameVersion}
          >
            <SelectTrigger id="gameVersion" aria-label="Filter by game version">
              <SelectValue placeholder="Select game version" />
            </SelectTrigger>
            <SelectContent>
              {gameVersionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="league" className="text-sm font-medium">
            League
          </label>
          <Select
            value={currentLeague}
            onValueChange={(v) => onLeagueChange?.(v)}
            disabled={!canChangeLeague}
          >
            <SelectTrigger id="league" aria-label="Filter by league">
              <SelectValue placeholder="Select league" />
            </SelectTrigger>
            <SelectContent>
              {leagueOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="difficulty" className="text-sm font-medium">
            Difficulty
          </label>
          <Select
            value={currentDifficulty}
            onValueChange={(v) => onDifficultyChange?.(v)}
            disabled={!canChangeDifficulty}
          >
            <SelectTrigger id="difficulty" aria-label="Filter by difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
