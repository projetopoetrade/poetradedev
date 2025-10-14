"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

export default function PrivacyPolicy() {
  const t = useTranslations('PrivacyPolicy');
  const locale = useLocale();

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Button variant="ghost" className="mb-6 gap-2" asChild>
        <Link href="/">
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>
      </Button>

      <Card className="p-8 md:p-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('lastUpdated')}: {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section1Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section1Content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section2Title')}</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">{t('section2Intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('section2Item1')}</li>
                <li>{t('section2Item2')}</li>
                <li>{t('section2Item3')}</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section3Title')}</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">{t('section3Intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('section3Item1')}</li>
                <li>{t('section3Item2')}</li>
                <li>{t('section3Item3')}</li>
                <li>{t('section3Item4')}</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section4Title')}</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">{t('section4Intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('section4Item1')}</li>
                <li>{t('section4Item2')}</li>
                <li>{t('section4Item3')}</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section5Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section5Content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section6Title')}</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">{t('section6Intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('section6Item1')}</li>
                <li>{t('section6Item2')}</li>
                <li>{t('section6Item3')}</li>
              </ul>
              <p className="leading-relaxed">{t('section6Note')}</p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section7Title')}</h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="leading-relaxed">{t('section7Intro')}</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>{t('section7Item1')}</li>
                <li>{t('section7Item2')}</li>
                <li>{t('section7Item3')}</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section8Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section8Content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section9Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section9Content')}
            </p>
          </section>

          <Separator />

          <div className="bg-muted/50 p-6 rounded-lg">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>{t('contactTitle')}</strong><br />
              {t('contactDescription')}<br />
              <a href="mailto:support@pathoftrade.net" className="text-primary hover:underline">
                support@pathoftrade.net
              </a>
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
}

