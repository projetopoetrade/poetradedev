"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from "next/dynamic";

const TawkTo = dynamic(() => import("@/components/tawTo"), { ssr: false });

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";")?.shift();
  return undefined;
}

export default function ConsentedProviders() {
  const [consent, setConsent] = useState<string | undefined>(undefined);

  useEffect(() => {
    setConsent(getCookie("cookie-consent"));
  }, []);

  const isAccepted = useMemo(() => consent === "accepted", [consent]);

  if (!isAccepted) return null;

  return (
    <>
      <GoogleAnalytics gaId="G-G1790M45LN" />
      <SpeedInsights />
      <TawkTo />
    </>
  );
}


