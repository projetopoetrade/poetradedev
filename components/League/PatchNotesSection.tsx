import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PatchCategory {
  title: string;
  changes: string[];
}

interface PatchNotesSectionProps {
  title: string;
  subtitle?: string;
  categories: PatchCategory[];
  officialNotesUrl?: string;
  officialNotesText?: string;
}

export default function PatchNotesSection({
  title,
  subtitle,
  categories,
  officialNotesUrl,
  officialNotesText
}: PatchNotesSectionProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* Categories */}
                <div className="space-y-6">
                  {categories.map((category, index) => (
                    <Card key={index} className="shadow-xl">
                      <CardHeader>
                        <CardTitle className="text-2xl">
                          {category.title}
                        </CardTitle>
                      </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {category.changes.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm leading-relaxed">
                        {change}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Official Notes Link */}
        {officialNotesUrl && (
          <div className="flex justify-center pt-4">
            <Button asChild size="lg">
              <a
                href={officialNotesUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                {officialNotesText || 'Ver Patch Notes Completo'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

