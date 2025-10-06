"use client";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations, useLocale } from "next-intl";

export default function TermsOfService() {
  const t = useTranslations('TermsOfService');
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
            <p className="text-muted-foreground leading-relaxed">
              {t('section2Content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section3Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section3Content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section4Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section4Content')}
            </p>
          </section>

          <section id="section5" className="space-y-4 scroll-mt-20">
            <h2 className="text-2xl font-semibold">{t('section5Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section5Content')}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section6Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section6Content')}
            </p>
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

          <section id="section8" className="space-y-4 scroll-mt-20">
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

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('section10Title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('section10Content')}
            </p>
          </section>

          <Separator />

          <div className="bg-muted/50 p-6 rounded-lg">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('acknowledgment')}
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
}

