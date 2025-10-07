"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy, Clock, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface PixQRCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixData: {
    id: string;
    status: string;
    amount: number;
    qrCode: string;
    copyPaste: string;
    expiresAt: string;
  } | null;
}

export function PixQRCodeModal({
  open,
  onOpenChange,
  pixData,
}: PixQRCodeModalProps) {
  const t = useTranslations("Cart");
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Copiar código PIX
  const handleCopy = async () => {
    if (pixData?.copyPaste) {
      await navigator.clipboard.writeText(pixData.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Calcular tempo restante
  useEffect(() => {
    if (!pixData?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(pixData.expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining("Expirado");
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [pixData?.expiresAt]);

  if (!pixData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <QrCode className="h-5 w-5 text-green-600" />
            {t("pixPaymentTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("pixPaymentDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Valor */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{t("pixAmount")}</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {(pixData.amount / 100).toFixed(2)}
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 border-2 border-green-600 rounded-lg overflow-hidden bg-white p-1">
              {pixData.qrCode && (
                <Image
                  src={pixData.qrCode}
                  alt="QR Code PIX"
                  fill
                  className="object-contain"
                  unoptimized
                />
              )}
            </div>
          </div>

          {/* Tempo restante */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-muted-foreground">{t("pixExpiresIn")}:</span>
            <span className="font-semibold text-orange-500">{timeRemaining}</span>
          </div>

          {/* Código Copia e Cola */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">{t("pixCopyPaste")}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pixData.copyPaste}
                readOnly
                className="flex-1 px-2 py-1.5 text-xs border rounded-md bg-muted font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0 h-8 w-8"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5">
            <p className="text-xs font-semibold text-blue-900">{t("pixInstructions")}</p>
            <ol className="text-xs text-blue-800 space-y-0.5 list-decimal list-inside">
              <li>{t("pixStep1")}</li>
              <li>{t("pixStep2")}</li>
              <li>{t("pixStep3")}</li>
            </ol>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-muted-foreground">
              {t("pixAwaitingPayment")}
            </span>
          </div>

          {/* ID da transação */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              ID: <span className="font-mono text-[10px]">{pixData.id}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-9 text-sm"
            onClick={() => onOpenChange(false)}
          >
            {t("close")}
          </Button>
          <Button
            type="button"
            className="flex-1 h-9 text-sm bg-green-600 hover:bg-green-700"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {t("copyCode")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

