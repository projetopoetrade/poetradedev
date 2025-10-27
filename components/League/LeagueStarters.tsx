import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Build {
  name: string;
  class: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Easy' | 'Medium' | 'Hard';
  pros: string[];
  cons: string[];
  guideUrl?: string;
  author?: string;
}

interface LeagueStartersProps {
  title: string;
  subtitle?: string;
  builds: Build[];
  locale: string;
}

export default function LeagueStarters({
  title,
  subtitle,
  builds,
  locale
}: LeagueStartersProps) {
  const getDifficultyVariant = (difficulty: string): "default" | "secondary" | "destructive" => {
    if (difficulty === 'Fácil' || difficulty === 'Easy') return 'default';
    if (difficulty === 'Médio' || difficulty === 'Medium') return 'secondary';
    return 'destructive';
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* Builds Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {builds.map((build, index) => (
            <Card key={index} className="shadow-xl hover:shadow-2xl transition-shadow overflow-hidden">
              {/* Build Header */}
              <CardHeader className="bg-primary text-primary-foreground">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">
                      {build.name}
                    </CardTitle>
                    <CardDescription className="text-primary-foreground/90">
                      {build.class}
                    </CardDescription>
                  </div>
                  <Badge variant={getDifficultyVariant(build.difficulty)}>
                    {build.difficulty}
                  </Badge>
                </div>
              </CardHeader>

              {/* Build Content */}
              <CardContent className="p-6 space-y-4">
                {/* Pros */}
                <div>
                  <h4 className="text-base font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {locale === 'pt-br' ? 'Vantagens' : 'Pros'}
                  </h4>
                  <ul className="space-y-1">
                    {build.pros.map((pro, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-green-600 dark:text-green-400 mt-1">+</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                {build.cons && build.cons.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {locale === 'pt-br' ? 'Desvantagens' : 'Cons'}
                    </h4>
                    <ul className="space-y-1">
                      {build.cons.map((con, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
                          <span className="text-red-600 dark:text-red-400 mt-1">-</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Guide Link */}
                {build.guideUrl && (
                  <div className="pt-4 border-t">
                    <a
                      href={build.guideUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium text-sm transition-colors"
                    >
                      {locale === 'pt-br' ? 'Ver Guia Completo' : 'View Full Guide'}
                      {build.author && ` (${build.author})`}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

