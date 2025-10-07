"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";

interface PaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPixSelect: () => void;
  onCardSelect: () => void;
  isLoading?: boolean;
}

export function PaymentMethodModal({
  open,
  onOpenChange,
  onPixSelect,
  onCardSelect,
  isLoading = false,
}: PaymentMethodModalProps) {
  const t = useTranslations("Cart");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t("paymentMethodTitle")}</DialogTitle>
          <DialogDescription>
            {t("paymentMethodDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <button
            onClick={onPixSelect}
            disabled={isLoading}
            className="relative flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-accent transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
              <Smartphone className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg">{t("pixPayment")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("pixPaymentDescription")}
              </p>
            </div>
            <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              {t("pixRecommended")}
            </div>
          </button>
          
          <button
            onClick={onCardSelect}
            disabled={isLoading}
            className="relative flex items-center gap-4 p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-accent transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg">{t("cardPayment")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("cardPaymentDescription")}
              </p>
            </div>
          </button>
        </div>

        <div className="text-xs text-muted-foreground text-center pb-2">
          {t("securePaymentNote")}
        </div>
      </DialogContent>
    </Dialog>
  );
}

