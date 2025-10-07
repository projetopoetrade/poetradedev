"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { SiPix } from "react-icons/si";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import {
  pixCheckoutSchema,
  type PixCheckoutInput,
} from "@/lib/validations/checkout";

interface PixFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PixCheckoutInput) => void;
  onBack: () => void;
  isLoading?: boolean;
  userEmail?: string;
}

export function PixFormModal({
  open,
  onOpenChange,
  onSubmit,
  onBack,
  isLoading = false,
  userEmail = "",
}: PixFormModalProps) {
  const t = useTranslations("Cart");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<PixCheckoutInput>({
    resolver: zodResolver(pixCheckoutSchema),
    mode: "onChange",
    defaultValues: {
      email: userEmail,
      cpf: "",
      phone: "",
    },
  });

  // Update email field when modal opens or userEmail changes
  useEffect(() => {
    if (open && userEmail) {
      setValue("email", userEmail, { shouldValidate: true });
    }
  }, [open, userEmail, setValue]);

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
    }
    onOpenChange(open);
  };

  const handleBackClick = () => {
    reset();
    onBack();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <SiPix className="h-6 w-6 text-green-600" />
            {t("pixPayment")}
          </DialogTitle>
          <DialogDescription>
            {t("pixFormDescription")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")} *</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                className={cn(
                  errors.email && "border-red-500 focus:border-red-500"
                )}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">{t("cpf")} *</Label>
              <Input
                id="cpf"
                placeholder={t("cpfPlaceholder")}
                maxLength={14}
                className={cn(
                  errors.cpf && "border-red-500 focus:border-red-500"
                )}
                {...register("cpf")}
                onChange={(e) => {
                  // Format CPF as user types: 000.000.000-00
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 11) {
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    e.target.value = value;
                  }
                  register("cpf").onChange(e);
                }}
              />
              {errors.cpf && (
                <p className="text-xs text-red-500">
                  {errors.cpf.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")} *</Label>
              <Input
                id="phone"
                placeholder={t("phonePlaceholder")}
                maxLength={15}
                className={cn(
                  errors.phone && "border-red-500 focus:border-red-500"
                )}
                {...register("phone")}
                onChange={(e) => {
                  // Format phone as user types: (00) 00000-0000 or (00) 0000-0000
                  let value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 11) {
                    value = value.replace(/^(\d{2})(\d)/, '($1) $2');
                    if (value.length > 10) {
                      value = value.replace(/(\d{5})(\d)/, '$1-$2');
                    } else {
                      value = value.replace(/(\d{4})(\d)/, '$1-$2');
                    }
                    e.target.value = value;
                  }
                  register("phone").onChange(e);
                }}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {t("pixInfoNote")}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleBackClick}
              disabled={isLoading}
            >
              {t("back")}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isLoading || !isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("confirmPixPayment")
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

