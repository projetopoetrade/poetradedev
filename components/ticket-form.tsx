"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  ticketSchema,
  sanitizeTicketData,
  MAX_EMAIL_LENGTH,
  MAX_SUBJECT_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MIN_DESCRIPTION_LENGTH,
  type TicketInput,
} from "@/lib/validations/ticket";

// Define the shape of the data returned from our API
interface ApiResponse {
  success?: boolean;
  ticketId?: string;
  error?: string;
}

// Security: Rate limiting - prevent spam
const RATE_LIMIT_MS = 30000; // 30 seconds between submissions
let lastSubmissionTime = 0;

export function TicketForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const t = useTranslations("Support");
  
  // States for user feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TicketInput>({
    resolver: zodResolver(ticketSchema),
    mode: "onBlur",
  });

  // Watch field values for character counters
  const subject = watch("subject", "");
  const description = watch("description", "");

  const onSubmit = async (data: TicketInput) => {
    // Security: Rate limiting check
    const currentTime = Date.now();
    if (currentTime - lastSubmissionTime < RATE_LIMIT_MS) {
      const waitTime = Math.ceil(
        (RATE_LIMIT_MS - (currentTime - lastSubmissionTime)) / 1000
      );
      setErrorMessage(
        t("rateLimitError", { seconds: waitTime.toString() })
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Security: Sanitize validated data
      const sanitizedData = sanitizeTicketData(data);

      const response = await fetch("/api/create-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitizedData),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("somethingWrong"));
      }

      setSuccessMessage(
        `${t("ticketSuccess")} ${result.ticketId}`
      );

      // Update rate limit timestamp
      lastSubmissionTime = Date.now();

      // Clear the form
      reset();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(t("unexpectedError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 shadow-lg max-w-2xl mx-auto w-full">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#DEDCFF] to-[#6f58ff] bg-clip-text text-transparent">
            {t("contactSupport")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {t("formDescription")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("yourEmail")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  maxLength={MAX_EMAIL_LENGTH}
                  className={cn(
                    "bg-white/5 border-white/10 focus:border-indigo-500",
                    errors.email && "border-red-500 focus:border-red-500"
                  )}
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  {t("subject")}
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder={t("subjectPlaceholder")}
                  maxLength={MAX_SUBJECT_LENGTH}
                  className={cn(
                    "bg-white/5 border-white/10 focus:border-indigo-500",
                    errors.subject && "border-red-500 focus:border-red-500"
                  )}
                  autoComplete="off"
                  {...register("subject")}
                />
                <div className="flex justify-between items-center">
                  {errors.subject && (
                    <p className="text-xs text-red-500">{errors.subject.message}</p>
                  )}
                  <p className={cn(
                    "text-xs text-muted-foreground",
                    errors.subject && "ml-auto"
                  )}>
                    {subject?.length || 0}/{MAX_SUBJECT_LENGTH}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  {t("howCanWeHelp")}
                </Label>
                <Textarea
                  id="description"
                  rows={6}
                  placeholder={t("descriptionPlaceholder")}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  className={cn(
                    "bg-white/5 border-white/10 focus:border-indigo-500 resize-none",
                    errors.description && "border-red-500 focus:border-red-500"
                  )}
                  {...register("description")}
                />
                <div className="flex justify-between items-center">
                  {errors.description && (
                    <p className="text-xs text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                  <p className={cn(
                    "text-xs text-muted-foreground",
                    errors.description && "ml-auto"
                  )}>
                    {description?.length || 0}/{MAX_DESCRIPTION_LENGTH} ({t("minimum")}{" "}
                    {MIN_DESCRIPTION_LENGTH})
                  </p>
                </div>
              </div>

              {successMessage && (
                <div className="text-sm p-3 rounded-md text-green-500 bg-green-500/10">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="text-sm p-3 rounded-md text-red-500 bg-red-500/10">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("sending") : t("submitTicket")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}