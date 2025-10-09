"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MessageCircle, Clock, Globe } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";


export default function ContactPage() {
  const t = useTranslations('Contact');

  // Structured data for Contact page
  const contactStructuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    mainEntity: {
      "@type": "Organization",
      name: "Path of Trade",
      description: "Professional Path of Exile currency trading service with 24/7 support",
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "Customer Service",
          email: "support@pathoftrade.net",
          availableLanguage: ["en", "pt-BR"],
          areaServed: "Worldwide",
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: "00:00",
            closes: "23:59"
          }
        }
      ],
      sameAs: [
        "https://discord.gg/pathoftrade"
      ]
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />
      <Button variant="ghost" className="mb-6 gap-2" asChild>
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>
      </Button>

      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{t('title')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Discord Card */}
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold">{t('discordTitle')}</h3>
              <p className="text-muted-foreground">
                {t('discordDescription')}
              </p>
              <div className="space-y-2">
                <p className="font-medium">{t('discordServer')}</p>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  pathoftrade.net/discord
                </div>
              </div>
              <Button asChild className="w-full">
                <a 
                  href="https://discord.gg/pathoftrade" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('joinDiscord')}
                </a>
              </Button>
            </div>
          </Card>

          {/* Email Card */}
          <Card className="p-8 text-center hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold">{t('emailTitle')}</h3>
              <p className="text-muted-foreground">
                {t('emailDescription')}
              </p>
              <div className="space-y-2">
                <p className="font-medium">{t('emailAddress')}</p>
                <div className="bg-muted p-3 rounded-lg font-mono text-sm">
                  support@pathoftrade.net
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a 
                  href="mailto:support@pathoftrade.net?subject=Support Request"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {t('sendEmail')}
                </a>
              </Button>
            </div>
          </Card>
        </div>

        {/* Support Hours */}
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold">{t('supportHoursTitle')}</h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div>
                <h4 className="font-semibold text-lg mb-2">{t('discordSupport')}</h4>
                <p className="text-muted-foreground">{t('discordHours')}</p>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">{t('emailSupport')}</h4>
                <p className="text-muted-foreground">{t('emailHours')}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-semibold mt-4">{t('additionalInfoTitle')}</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">{t('responseTimeTitle')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{t('discordResponse')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{t('emailResponse')}</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">{t('bestForTitle')}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">•</span>
                    <span>{t('discordBest')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{t('emailBest')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Support Ticket Link */}
        <Card className="p-8 bg-primary/5 border-primary/20">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-semibold">{t('ticketTitle')}</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('ticketDescription')}
            </p>
            <Button asChild size="lg">
              <Link href="/support/tickets" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {t('createTicket')}
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
