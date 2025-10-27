import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MechanicPoint {
  title: string;
  description: string;
}

interface MechanicAnalysisProps {
  title: string;
  description: string;
  mainPoints: MechanicPoint[];
  tradeImpact?: {
    title: string;
    points: string[];
  };
  ctaLink?: string;
  ctaText?: string;
  locale: string;
}

export default function MechanicAnalysis({
  title,
  description,
  mainPoints,
  tradeImpact,
  ctaLink,
  ctaText,
}: MechanicAnalysisProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Main Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mainPoints.map((point, index) => (
                    <Card key={index} className="shadow-xl hover:shadow-2xl transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-xl">
                          {point.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="leading-relaxed">
                          {point.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>

        {/* Trade Impact Section */}
        {tradeImpact && (
          <Card className="border-l-4 border-l-primary shadow-xl">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-4">
                    {tradeImpact.title}
                  </CardTitle>
                  <ul className="space-y-2">
                    {tradeImpact.points.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardHeader>
            {ctaLink && ctaText && (
              <CardContent>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={ctaLink} className="inline-flex items-center gap-2">
                    {ctaText}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </Button>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </section>
  );
}

