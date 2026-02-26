"use client";
import Image from "next/image";
import { useState, useEffect } from "react";

const ASCENDANCY_PROMO_MAP: Record<string, string> = {
  // PoE 1 — promo images from pathofexile.com/ascendancy/classes
  Necromancer:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Necromancer.png?key=elS-LvLYJzjIbJuOdVP5_g",
  Elementalist:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Elementalist.png?key=xTQG41cKmhvNFrwu_cN7CQ",
  Occultist:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Occultist.png?key=mV3c0qbitkd9QJL1ZGZVXQ",
  Assassin:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Assassin.png?key=ZxaRbd_wAQJa1Ma_Yu-_cA",
  Saboteur:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Saboteur.png?key=j7PBS-x41WkhF32aQOT0bA",
  Trickster:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Trickster.png?key=xsXRx0faBRn5OiV5ghrnGQ",
  Deadeye:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Deadeye.png?key=cXCSUiBfopA9ApEMtnYbLw",
  Pathfinder:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Pathfinder.png?key=tdQf9JweYNzFfy3FgH9qpQ",
  Warden:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Warden.png?key=41OaJS3vcJUhYFnvSRCfUw",
  Gladiator:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Gladiator.png?key=09py0OfLrWjOVQIbfU1m6w",
  Champion:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Champion.png?key=tgo2quXqkaI3QGvIRJSi6Q",
  Juggernaut:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Juggernaut.png?key=9QcvWBwz82ssD8VPHWBMUA",
  Berserker:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Berserker.png?key=wwrBpvaFm_G9pmy7yKtUGg",
  Chieftain:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Chieftain.png?key=OigrIPPg6pUUcLD_h0uQFg",
  Inquisitor:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Inquisitor.png?key=DhDuviNFcgwY_8QpofzRRg",
  Hierophant:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Hierophant.png?key=8QDOpgoGaZS0ksXADuoUKw",
  Guardian:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Guardian.png?key=dUCfULonJ5ihtjU8G0cDoA",
  Ascendant:
    "https://web.poecdn.com/protected/image/promo/ascendancy/classes/Ascendant.png?key=2-zRw53BEG3Ca-1BSn3_XQ",
};

const ASCENDANCY_INGAME_MAP: Record<string, string> = {
  // PoE 2 — in-game passive skill screen images
  Infernalist:
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Infernalist.png",
  "Blood Mage":
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/BloodMage.png",
  Titan:
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Titan.png",
  Warbringer:
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Warbringer.png",
  Witchhunter:
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Witchhunter.png",
  "Gemling Legionnaire":
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/GemlingLegionnaire.png",
  Invoker:
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Invoker.png",
  "Acolyte of Chayula":
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/AcolyteOfChayula.png",
  Stormweaver:
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Stormweaver.png",
  Chronomancer:
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Chronomancer.png",
  // PoE 1 fallback
  Raider:
    "https://web.poecdn.com/image/Art/2DArt/UIImages/InGame/PassiveSkillScreenStart/Classes/Ascendancy/Raider.png",
};

const ASCENDANCY_ICON_MAP: Record<string, string> = {
  // PoE 1 — local icons from public/images/ascendancy
  Necromancer: "/images/ascendancy/poe1/Necromancer.png",
  Elementalist: "/images/ascendancy/poe1/Elementalist.png",
  Occultist: "/images/ascendancy/poe1/Occultist.png",
  Assassin: "/images/ascendancy/poe1/Assassin.png",
  Trickster: "/images/ascendancy/poe1/Trickster.png",
  Saboteur: "/images/ascendancy/poe1/Saboteur.png",
  Deadeye: "/images/ascendancy/poe1/Deadeye.png",
  Pathfinder: "/images/ascendancy/poe1/Pathfinder.png",
  Warden: "/images/ascendancy/poe1/Warden.png",
  Slayer: "/images/ascendancy/poe1/Slayer.png",
  Gladiator: "/images/ascendancy/poe1/Gladiator.png",
  Champion: "/images/ascendancy/poe1/Champion.png",
  Juggernaut: "/images/ascendancy/poe1/Juggernaut.png",
  Berserker: "/images/ascendancy/poe1/Berserker.png",
  Chieftain: "/images/ascendancy/poe1/Chieftain.png",
  Inquisitor: "/images/ascendancy/poe1/Inquisitor.png",
  Hierophant: "/images/ascendancy/poe1/Hierophant.png",
  Guardian: "/images/ascendancy/poe1/Guardian.png",
  Ascendant: "/images/ascendancy/poe1/Ascendant.png",
  // PoE 1 fallback
  Raider: "/images/ascendancy/poe1/Deadeye.png",
  // PoE 2 — local icons from public/images/ascendancy
  Infernalist: "/images/ascendancy/poe2/Infernalist.png",
  "Blood Mage": "/images/ascendancy/poe2/Blood Mage.png",
  Titan: "/images/ascendancy/poe2/Titan.png",
  Warbringer: "/images/ascendancy/poe2/Warbringer.png",
  Witchhunter: "/images/ascendancy/poe2/Witchhunter.png",
  "Gemling Legionnaire": "/images/ascendancy/poe2/Gemling Legionnaire.png",
  Invoker: "/images/ascendancy/poe2/Invoker.png",
  "Acolyte of Chayula": "/images/ascendancy/poe2/Acolyte of Chayula.png",
  Stormweaver: "/images/ascendancy/poe2/Stormweaver.png",
  Chronomancer: "/images/ascendancy/poe2/Chronomancer.png",
};

type ImageVariant = "full" | "icon";

interface AscendancyImageProps {
  ascendancy: string;
  imageUrl?: string | null;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  gameVersion?: string;
  variant?: ImageVariant;
}

function getAscendancyUrl(
  ascendancy: string,
  gameVersion?: string,
  variant: ImageVariant = "full",
): string | null {
  if (variant === "icon") {
    return ASCENDANCY_ICON_MAP[ascendancy] ?? null;
  }

  const isPoE2 = gameVersion === "path-of-exile-2";

  if (isPoE2) {
    return (
      ASCENDANCY_INGAME_MAP[ascendancy] ??
      ASCENDANCY_ICON_MAP[ascendancy] ??
      null
    );
  }

  return (
    ASCENDANCY_PROMO_MAP[ascendancy] ??
    ASCENDANCY_INGAME_MAP[ascendancy] ??
    ASCENDANCY_ICON_MAP[ascendancy] ??
    null
  );
}

export default function AscendancyImage({
  ascendancy,
  imageUrl,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
  gameVersion,
  variant = "full",
}: AscendancyImageProps) {
  const cdnUrl = getAscendancyUrl(ascendancy, gameVersion, variant);
  const [src, setSrc] = useState<string>(imageUrl || cdnUrl || "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(imageUrl || cdnUrl || "");
    setFailed(false);
  }, [imageUrl, cdnUrl]);

  const handleError = () => {
    if (src !== cdnUrl && cdnUrl) {
      setSrc(cdnUrl);
    } else {
      setFailed(true);
    }
  };

  const isExternalCdn =
    src.startsWith("https://web.poecdn.com") ||
    src.startsWith("https://cdn.poedb.tw");

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-800 text-gray-400 text-xs font-medium ${className ?? ""}`}
        style={!fill ? { width, height } : undefined}
      >
        {ascendancy.charAt(0)}
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt ?? ascendancy}
        fill
        className={className}
        sizes={sizes}
        onError={handleError}
        unoptimized={isExternalCdn}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? ascendancy}
      width={variant === "icon" ? 64 : (width ?? 400)}
      height={variant === "icon" ? 64 : (height ?? 300)}
      className={className}
      sizes={sizes}
      onError={handleError}
      unoptimized={isExternalCdn}
    />
  );
}
