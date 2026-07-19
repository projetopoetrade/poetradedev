"use client";

import { useState, useTransition, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Dices, RefreshCw, Play } from "lucide-react";
import { getRandomBuilds } from "@/app/actions";
import BuildCard from "@/components/Builds/BuildCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { BUILD_TAGS, getClassesForGameVersion } from "@/lib/builds-data";
import type { Build } from "@/lib/interface";

type RandomizerStatus = "idle" | "loading" | "animating" | "finished" | "empty";

interface BuildRandomizerClientProps {
  locale: string;
}

export default function BuildRandomizerClient({
  locale,
}: BuildRandomizerClientProps) {
  const isPt = locale === "pt-br";
  const t = useTranslations("BuildsList");

  // Filters State
  const [gameVersion, setGameVersion] = useState("path-of-exile-1");
  const [league, setLeague] = useState("all");
  const [poeClass, setPoeClass] = useState("all");
  const [ascendancy, setAscendancy] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [budget, setBudget] = useState("all");
  const [tags, setTags] = useState<string[]>(["league-starter"]);
  const [onlyLeagueStarters, setOnlyLeagueStarters] = useState(true);

  // App State
  const [status, setStatus] = useState<RandomizerStatus>("idle");
  const [candidates, setCandidates] = useState<Build[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);

  // Derived state for selects
  const classes = getClassesForGameVersion(gameVersion);
  const selectedClassData = classes.find((c) => c.name === poeClass);
  const ascendancies = selectedClassData?.ascendancies ?? [];

  // Reset dependent filters when parent changes
  useEffect(() => {
    setPoeClass("all");
    setAscendancy("all");
  }, [gameVersion]);

  useEffect(() => {
    setAscendancy("all");
  }, [poeClass]);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const startRoulette = (buildCandidates: Build[]) => {
    if (!buildCandidates.length) return;

    const finalIndex = Math.floor(Math.random() * buildCandidates.length);
    const delays = [80, 80, 100, 120, 150, 200, 260, 330, 400, 500, 600]; // Slowing down

    let step = 0;
    let localIndex = 0;

    const tick = () => {
      localIndex = (localIndex + 1) % buildCandidates.length;
      setCurrentIndex(localIndex);

      if (step < delays.length - 1) {
        step++;
        setTimeout(tick, delays[step]);
      } else {
        setCurrentIndex(finalIndex);
        setSelectedBuild(buildCandidates[finalIndex]);
        setStatus("finished");
      }
    };

    setStatus("animating");
    setTimeout(tick, delays[0]);
  };

  const handleRoll = async () => {
    if (status === "animating" || status === "loading") return;

    setStatus("loading");
    setSelectedBuild(null);

    try {
      const builds = await getRandomBuilds({
        gameVersion: gameVersion === "all" ? undefined : gameVersion,
        league: league === "all" ? undefined : league,
        class: poeClass === "all" ? undefined : poeClass,
        ascendancy: ascendancy === "all" ? undefined : ascendancy,
        difficulty: difficulty === "all" ? undefined : difficulty,
        budget: budget === "all" ? undefined : budget,
        tags: tags.length > 0 ? tags : undefined,
        onlyLeagueStarters,
      });

      if (!builds || builds.length === 0) {
        setStatus("empty");
      } else {
        setCandidates(builds);
        startRoulette(builds);
      }
    } catch (error) {
      console.error(error);
      setStatus("empty");
    }
  };

  const isControlsDisabled = status === "loading" || status === "animating";

  return (
    <div className="min-h-screen py-12 px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-4 flex items-center justify-center gap-3">
          <Dices className="w-8 h-8 text-amber-500" />
          Build Randomizer
        </h1>
        <p className="text-gray-400 text-lg">
          {isPt
            ? "Defina alguns filtros e deixe o Path of Trade escolher sua próxima build."
            : "Set a few filters and let Path of Trade pick your next build."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 border border-gray-800 bg-gray-900/40 p-6 rounded-xl space-y-6">
          <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-800 pb-2">
            {t("randomizer.filtersHeading")}
          </h2>

          <div className="space-y-4">
            {/* Game Version */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                {t("filters.gameVersion")}
              </label>
              <Select
                disabled={isControlsDisabled}
                value={gameVersion}
                onValueChange={setGameVersion}
              >
                <SelectTrigger className="w-full bg-black/40 border-gray-700/50">
                  <SelectValue placeholder={t("filters.gameVersion")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="path-of-exile-1">
                    Path of Exile 1
                  </SelectItem>
                  <SelectItem value="path-of-exile-2">
                    Path of Exile 2
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">{t("filters.class")}</label>
              <Select
                disabled={isControlsDisabled}
                value={poeClass}
                onValueChange={setPoeClass}
              >
                <SelectTrigger className="w-full bg-black/40 border-gray-700/50">
                  <SelectValue placeholder={t("filters.class")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allClasses")}</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ascendancy */}
            {ascendancies.length > 0 && (
              <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">
                    {t("filters.ascendancy")}
                  </label>
                  <Select
                    disabled={isControlsDisabled}
                    value={ascendancy}
                    onValueChange={setAscendancy}
                  >
                    <SelectTrigger className="w-full bg-black/40 border-gray-700/50">
                      <SelectValue placeholder={t("filters.ascendancy")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filters.allAscendancies")}</SelectItem>
                    {ascendancies.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                {t("filters.difficulty")}
              </label>
              <Select
                disabled={isControlsDisabled}
                value={difficulty}
                onValueChange={setDifficulty}
              >
                <SelectTrigger className="w-full bg-black/40 border-gray-700/50">
                  <SelectValue placeholder={t("filters.difficulty")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.anyDifficulty")}</SelectItem>
                  <SelectItem value="easy">{t("filters.easy")}</SelectItem>
                  <SelectItem value="medium">{t("filters.medium")}</SelectItem>
                  <SelectItem value="hard">{t("filters.hard")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budget */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">
                {t("filters.budget")}
              </label>
              <Select
                disabled={isControlsDisabled}
                value={budget}
                onValueChange={setBudget}
              >
                <SelectTrigger className="w-full bg-black/40 border-gray-700/50">
                  <SelectValue placeholder={t("filters.budget")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.anyBudget")}</SelectItem>
                  <SelectItem value="cheap">{t("filters.cheap")}</SelectItem>
                  <SelectItem value="medium">{t("filters.medium")}</SelectItem>
                  <SelectItem value="expensive">{t("filters.expensive")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2 pt-2 border-t border-gray-800">
              <label className="text-sm font-medium text-gray-300">{t("filters.tags")}</label>
              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
                  <Checkbox
                    id="league-starter-only"
                    aria-label="Only show builds that are league starters"
                    checked={onlyLeagueStarters}
                    onCheckedChange={(checked) =>
                      setOnlyLeagueStarters(checked === true)
                    }
                    disabled={isControlsDisabled}
                    className="border-amber-500/50 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black"
                  />
                  <label
                    htmlFor="league-starter-only"
                    className="text-sm font-medium text-amber-400 cursor-pointer"
                  >
                    {t("filters.leagueStarterOnly")}
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {BUILD_TAGS.filter((t) => t.value !== "league-starter").map(
                    (tag) => {
                      const active = tags.includes(tag.value);
                      return (
                        <button
                          key={tag.value}
                          onClick={() => toggleTag(tag.value)}
                          disabled={isControlsDisabled}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-all disabled:opacity-50 ${
                            active
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "bg-black/40 text-gray-400 border-gray-700/50 hover:border-gray-500"
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Roulette Area */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center min-h-[500px] border border-gray-800 bg-gray-900/20 p-8 rounded-xl relative overflow-hidden">
          {/* Status states */}
          {status === "idle" && (
            <div className="text-center space-y-6">
              <Dices className="w-24 h-24 mx-auto text-gray-700" />
              <p className="text-xl text-gray-400 max-w-sm mx-auto">
                {isPt
                  ? "Pronto para rolar? Ajuste seus filtros e clique no botão abaixo."
                  : "Ready to roll? Adjust your filters and click the button below."}
              </p>
            </div>
          )}

          {status === "empty" && (
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center">
                <Dices className="w-12 h-12 text-gray-500" />
              </div>
              <p className="text-xl text-red-400 max-w-sm mx-auto">
                {isPt
                  ? "Nenhuma build encontrada para esses filtros. Tente relaxar um pouco os critérios."
                  : "No builds found for these filters. Try relaxing your criteria."}
              </p>
            </div>
          )}

          {status === "loading" && (
            <div className="text-center space-y-4">
              <RefreshCw className="w-12 h-12 mx-auto text-amber-500 animate-spin" />
              <p className="text-gray-400 animate-pulse">
                {isPt ? "Buscando builds..." : "Fetching builds..."}
              </p>
            </div>
          )}

          {status === "animating" && candidates.length > 0 && (
            <div className="w-full max-w-sm mx-auto transition-transform duration-75 transform scale-100 opacity-80 pointer-events-none">
              <BuildCard build={candidates[currentIndex]} locale={locale} />
              <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay animate-pulse rounded-xl" />
            </div>
          )}

          {status === "finished" && selectedBuild && (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-in fade-in zoom-in duration-500">
              <div className="relative w-full shadow-2xl shadow-amber-500/20 transform scale-105 transition-all outline outline-2 outline-amber-500/50 rounded-xl rounded-b-none">
                <BuildCard build={selectedBuild} locale={locale} />
              </div>
              <div className="w-full bg-amber-500/10 border-x border-b border-amber-500/50 p-4 rounded-b-xl flex justify-center mt-[-4px] z-10">
                <Link
                  href={`/builds/${selectedBuild.slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2.5 px-4 rounded transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isPt ? "Ver Detalhes da Build" : "View Build Details"}
                </Link>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-12">
            <button
              onClick={handleRoll}
              disabled={isControlsDisabled}
              className={`
                group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-bold text-xl rounded-lg shadow-xl uppercase tracking-wide
                transition-all duration-300 transform
                ${isControlsDisabled ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-amber-500/40"}
              `}
            >
              {status === "animating" && (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  {t("randomizer.rolling")}
                </span>
              )}
              {status !== "animating" && (
                <span className="flex items-center gap-3">
                  <Dices className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  {status === "finished"
                    ? t("randomizer.rollAgain")
                    : t("randomizer.rollBuild")}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SEO & FAQ Section */}
      <div className="mt-20 border-t border-gray-800 pt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* SEO Text Block */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {isPt
                ? "O que é o PoE Build Randomizer?"
                : "What is the PoE Build Randomizer?"}
            </h2>
            <p className="text-gray-400 leading-relaxed">
              {isPt
                ? "O Path of Exile Build Randomizer (ou Roleta de Builds) é uma ferramenta gratuita criada para ajudar jogadores indecisos a escolherem sua próxima jornada em Wraeclast. Seja você um novato procurando um League Starter seguro ou um veterano procurando por builds off-meta para o Endgame, nossa roleta cobre centenas de opções para Path of Exile 1 e Path of Exile 2."
                : "The Path of Exile Build Randomizer (or Build Roulette) is a free tool designed to help undecided players pick their next journey in Wraeclast. Whether you are a beginner looking for a safe League Starter or a veteran searching for off-meta Endgame builds, our roulette covers hundreds of options for both Path of Exile 1 and Path of Exile 2."}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-white mb-3">
              {isPt
                ? "Como a Roleta de Builds funciona?"
                : "How does the Build Roulette work?"}
            </h3>
            <p className="text-gray-400 leading-relaxed mb-4">
              {isPt
                ? "Nós indexamos constantemente as melhores builds criadas pelas mentes brilhantes da comunidade. Ao preencher os filtros acima (como orçamento, dificuldade ou estilo de jogo), o Path of Trade busca as opções correspondentes e faz um sorteio animado na tela para te presentear com a build ideal. Chega de sofrer com a famosa 'paralisia de escolha' no início de cada liga!"
                : "We constantly index the best builds crafted by the brilliant minds of the community. By filling out the filters above (such as budget, difficulty, or playstyle), Path of Trade searches for matching options and runs an animated raffle on your screen to present you with the ideal build. No more suffering from the infamous 'choice paralysis' at the start of each league!"}
            </p>
          </div>
        </div>

        {/* FAQ Block */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            {isPt
              ? "Perguntas Frequentes (FAQ)"
              : "Frequently Asked Questions (FAQ)"}
          </h2>

          <Accordion type="single" collapsible className="w-full text-gray-300">
            <AccordionItem value="item-1" className="border-gray-800">
              <AccordionTrigger className="hover:text-amber-400 hover:no-underline text-left">
                {isPt
                  ? "O que define um bom League Starter no Path of Exile?"
                  : "What makes a good League Starter in Path of Exile?"}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                {isPt
                  ? "Um verdadeiro League Starter é uma build que não depende de itens únicos específicos ou equipamentos caros para funcionar, permitindo escalar gradualmente seu dano e sobrevivência apenas com itens raros encontrados no chão ("
                  : "A true League Starter is a build that doesn't rely on specific unique items or expensive gear to function, allowing you to gradually scale your damage and survivability just with rare items found on the ground ("}
                <i>SSF viable</i>
                {isPt
                  ? "). É a build ideal para usar nos primeiros dias de uma economia fresca."
                  : "). It is the ideal build to use in the first days of a fresh economy."}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="border-gray-800">
              <AccordionTrigger className="hover:text-amber-400 hover:no-underline text-left">
                {isPt
                  ? "O sorteador suporta builds de Path of Exile 2?"
                  : "Does the randomizer support Path of Exile 2 builds?"}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                {isPt
                  ? "Sim! Selecione a aba 'Path of Exile 2' no filtro de versão do jogo. O sorteador buscará instantaneamente por opções usando as novas classes (Mercenary, Warrior, Sorceress, etc) e ascendências recentes adicionadas ao jogo."
                  : "Yes! Select the 'Path of Exile 2' tab in the game version filter. The randomizer will instantly search for options using the new classes (Mercenary, Warrior, Sorceress, etc) and recent ascendancies added to the game."}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="border-gray-800">
              <AccordionTrigger className="hover:text-amber-400 hover:no-underline text-left">
                {isPt
                  ? "Essas builds estão atualizadas para a liga atual?"
                  : "Are these builds updated for the current league?"}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                {isPt
                  ? "Absolutamente. Nós apenas mantemos publicadas builds pertinentes ao Patch Note e mudanças recentes das expansões (como as passivas e balanceamentos de gemas). Você pode refinar ainda mais a busca selecionando a Liga exata no filtro correspondente."
                  : "Absolutely. We only keep published builds that are relevant to the latest Patch Notes and expansion changes (such as passive tree updates and gem balance). You can refine your search even further by selecting the exact League in the corresponding filter."}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
