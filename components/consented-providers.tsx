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
  const [shouldLoadTawk, setShouldLoadTawk] = useState(false);

  useEffect(() => {
    setConsent(getCookie("cookie-consent"));
  }, []);

  const isAccepted = useMemo(() => consent === "accepted", [consent]);

  // Once consent is accepted, schedule Tawk.to load on idle or first interaction
  useEffect(() => {
    if (!isAccepted || shouldLoadTawk) return;

    const load = () => setShouldLoadTawk(true);

    // Prefer idle callback with a timeout fallback
    let idleId: number | undefined;
    const ric = (window as any).requestIdleCallback as undefined | ((cb: Function, opts?: { timeout?: number }) => number);
    const cic = (window as any).cancelIdleCallback as undefined | ((id: number) => void);
    if (typeof ric === "function") {
      idleId = ric(load, { timeout: 4000 });
    } else {
      // Fallback: load after a short delay
      setTimeout(load, 4000);
    }

    // Also load on first user interaction
    const onFirstInteraction = () => {
      load();
      removeListeners();
    };
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "mousemove", "touchstart", "scroll"];
    const removeListeners = () => {
      events.forEach((type) => window.removeEventListener(type, onFirstInteraction, { passive: true } as any));
    };
    events.forEach((type) => window.addEventListener(type, onFirstInteraction, { passive: true } as any));

    return () => {
      removeListeners();
      if (idleId && typeof cic === "function") cic(idleId);
    };
  }, [isAccepted, shouldLoadTawk]);

  if (!isAccepted) return null;

  return (
    <>
      <GoogleAnalytics gaId="G-G1790M45LN" />
      <SpeedInsights />
      {shouldLoadTawk ? <TawkTo /> : null}
    </>
  );
}


