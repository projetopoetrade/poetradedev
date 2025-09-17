// GameCard.tsx
"use client";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export type GameVersion = "path-of-exile-1" | "path-of-exile-2";

interface GameCardProps {
  imageSrc: string;
  title: string;
  subtitle?: string;
  gameVersion: GameVersion;
}

export function GameCard({
  imageSrc,
  title,
  subtitle,
  gameVersion,
}: GameCardProps) {
  const router = useRouter();
  const handleGameSelection = () => {
    router.push(`/games/${encodeURIComponent(gameVersion)}/`);
  };

  return (
    <div
      className="w-full max-w-[400px] md:max-w-[600px]"
    >
      <Card
        role="button"
        aria-label={`Select ${title}`}
        onClick={handleGameSelection}
        onKeyDown={(e) => e.key === "Enter" && handleGameSelection()}
        tabIndex={0}
        className={cn(
          "group relative overflow-hidden",
          "h-[400px] md:h-[600px]",
          "transition-all duration-300 ease-out",
          "shadow-xl hover:shadow-2xl",
          "border-2 border-transparent hover:border-[#6f58ff]/50",
          "cursor-pointer bg-card/50 backdrop-blur-sm"
        )}
      >
        <CardContent className="relative h-full p-0">
          <Image
            src={imageSrc}
            alt={`${title} Cover Art ${gameVersion}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center"
            quality={75}
            priority
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent via-black/20" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg md:text-xl text-[#DEDCFF] font-medium drop-shadow">
                {subtitle}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
