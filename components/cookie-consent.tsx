"use client";

import { useEffect, useState } from "react";

type CookieConsentProps = {
  locale?: string;
};

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";")?.shift();
  return undefined;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
}

export default function CookieConsent({ locale }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookie("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const isPt = (locale ?? "").toLowerCase().startsWith("pt");

  const handleAccept = () => {
    setCookie("cookie-consent", "accepted", 180);
    setVisible(false);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  const handleReject = () => {
    setCookie("cookie-consent", "denied", 180);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-lg border border-foreground/20 bg-background/95 backdrop-blur p-4 md:p-5 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {isPt
                ? "Usamos cookies essenciais e opcionais para melhorar sua experiência. Você aceita cookies opcionais?"
                : "We use essential and optional cookies to improve your experience. Do you accept optional cookies?"}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="px-3 py-2 rounded-md border border-foreground/20 text-sm hover:bg-foreground/5"
                onClick={handleReject}
              >
                {isPt ? "Recusar" : "Decline"}
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-md bg-foreground text-background text-sm hover:opacity-90"
                onClick={handleAccept}
              >
                {isPt ? "Aceitar" : "Accept"}
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-foreground/60">
            {isPt
              ? "Cookies essenciais não podem ser desativados."
              : "Essential cookies can’t be disabled."}
          </p>
        </div>
      </div>
    </div>
  );
}


