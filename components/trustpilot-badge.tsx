"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

export function TrustpilotBadge() {
  const t = useTranslations("Footer");
  const url = t("trustpilot-url");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center md:items-start gap-1 group"
    >
      <div className="flex items-center gap-1">
        <span className="text-white font-bold text-lg tracking-tight">Trustpilot</span>
      </div>
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-[#00b67a] p-0.5">
            <Star size={14} fill="white" stroke="white" />
          </div>
        ))}
      </div>
      <span className="text-gray-400 text-xs group-hover:text-white transition-colors">
        {t("trustpilot-review")}
      </span>
    </a>
  );
}
