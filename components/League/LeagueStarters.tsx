import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BuildGuide {
  title: string;
  url: string;
  author?: string;
  variant?: string;
}

interface Build {
  name: string;
  class: string;
  tier?: 'S' | 'A' | 'B' | 'C';
  difficulty: 'Fácil' | 'Médio' | 'Difícil' | 'Baixa' | 'Média' | 'Alta' | 'Easy' | 'Medium' | 'Hard' | 'Low' | 'High';
  pros: string[];
  cons: string[];
  guideUrl?: string;
  guides?: BuildGuide[];
  author?: string;
  description?: string;
}

interface LeagueStartersProps {
  title: string;
  subtitle?: string;
  tierS?: {
    title: string;
    description: string;
  };
  tierA?: {
    title: string;
    description: string;
  };
  builds: Build[];
  locale: string;
}

export default function LeagueStarters({
  title,
  subtitle,
  tierS,
  tierA,
  builds,
  locale
}: LeagueStartersProps) {

  const getTierVariant = (tier: string): "default" | "secondary" | "destructive" | "outline" => {
    if (tier === 'S') return 'destructive';
    if (tier === 'A') return 'secondary';
    if (tier === 'B') return 'default';
    return 'outline';
  };

  const getTierColor = (tier: string): string => {
    if (tier === 'S') return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
    if (tier === 'A') return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    if (tier === 'B') return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  };

  const getTierIcon = (tier: string): string => {
    if (tier === 'S') return '⭐'; // Star
    if (tier === 'A') return '💎'; // Diamond
    if (tier === 'B') return '🥉'; // Bronze medal
    return '📋'; // Clipboard
  };

  // Group builds by tier
  const sTierBuilds = builds.filter(build => build.tier === 'S');
  const aTierBuilds = builds.filter(build => build.tier === 'A');
  const otherBuilds = builds.filter(build => !build.tier || (build.tier !== 'S' && build.tier !== 'A'));

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

        {/* S-Tier Section */}
        {sTierBuilds.length > 0 && tierS && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2 flex items-center justify-center gap-2">
                <span className="text-3xl">⭐</span>
                {tierS.title}
              </h3>
              <p className="text-muted-foreground">
                {tierS.description}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {sTierBuilds.map((build, index) => (
                <Card key={index} className="shadow-xl hover:shadow-2xl transition-shadow overflow-hidden border-purple-200 dark:border-purple-800 flex flex-col min-h-[500px]">
                  {/* Build Header */}
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2">
                          <CardTitle className="text-2xl">
                            {build.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-white/90">
                          {build.class}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {renderBuildContent(build)}
                  {(build.guideUrl || (build.guides && build.guides.length > 0)) && (
                    <div className="px-6 py-4 bg-muted/30 border-t mt-auto">
                      <div className="flex flex-wrap justify-center gap-2">
                        {build.guides && build.guides.length > 0 ? (
                          build.guides.map((guide, guideIndex) => (
                            <a
                              key={guideIndex}
                              href={guide.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors group px-3 py-2 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                            >
                              
                              <span>{guide.title}</span>
                              {guide.author && (
                                <span className="text-xs opacity-75">by {guide.author}</span>
                              )}
                              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                              </svg>
                            </a>
                          ))
                        ) : build.guideUrl ? (
                          <a
                            href={build.guideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors group px-3 py-2 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>{locale === 'pt-br' ? 'Ver Guia Completo' : 'View Full Guide'}</span>
                            {build.author && (
                              <span className="text-xs opacity-75">by {build.author}</span>
                            )}
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* A-Tier Section */}
        {aTierBuilds.length > 0 && tierA && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center justify-center gap-2">
                <span className="text-3xl">💎</span>
                {tierA.title}
              </h3>
              <p className="text-muted-foreground">
                {tierA.description}
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {aTierBuilds.map((build, index) => (
                <Card key={index} className="shadow-xl hover:shadow-2xl transition-shadow overflow-hidden border-blue-200 dark:border-blue-800 flex flex-col min-h-[500px]">
                  {/* Build Header */}
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2">
                          <CardTitle className="text-2xl">
                            {build.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-white/90">
                          {build.class}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {renderBuildContent(build)}
                  {(build.guideUrl || (build.guides && build.guides.length > 0)) && (
                    <div className="px-6 py-4 bg-muted/30 border-t mt-auto">
                      <div className="flex flex-wrap justify-center gap-2">
                        {build.guides && build.guides.length > 0 ? (
                          build.guides.map((guide, guideIndex) => (
                            <a
                              key={guideIndex}
                              href={guide.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors group px-3 py-2 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                            >
                              
                              <span>{guide.title}</span>
                              {guide.author && (
                                <span className="text-xs opacity-75">by {guide.author}</span>
                              )}
                              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                              </svg>
                            </a>
                          ))
                        ) : build.guideUrl ? (
                          <a
                            href={build.guideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors group px-3 py-2 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>{locale === 'pt-br' ? 'Ver Guia Completo' : 'View Full Guide'}</span>
                            {build.author && (
                              <span className="text-xs opacity-75">by {build.author}</span>
                            )}
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Tiers */}
        {otherBuilds.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <span className="text-3xl">📋</span>
                {locale === 'pt-br' ? 'Outras Opções' : 'Other Options'}
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {otherBuilds.map((build, index) => (
                <Card key={index} className="shadow-xl hover:shadow-2xl transition-shadow overflow-hidden flex flex-col min-h-[500px]">
                  {/* Build Header */}
                  <CardHeader className="bg-primary text-primary-foreground">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2">
                          <CardTitle className="text-2xl">
                            {build.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-primary-foreground/90">
                          {build.class}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {renderBuildContent(build)}
                  {(build.guideUrl || (build.guides && build.guides.length > 0)) && (
                    <div className="px-6 py-4 bg-muted/30 border-t mt-auto">
                      <div className="flex flex-wrap justify-center gap-2">
                        {build.guides && build.guides.length > 0 ? (
                          build.guides.map((guide, guideIndex) => (
                            <a
                              key={guideIndex}
                              href={guide.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors group px-3 py-2 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                            >
                              
                              <span>{guide.title}</span>
                              {guide.author && (
                                <span className="text-xs opacity-75">by {guide.author}</span>
                              )}
                              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 17L17 7M17 7H7M17 7V17"/>
                              </svg>
                            </a>
                          ))
                        ) : build.guideUrl ? (
                          <a
                            href={build.guideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors group px-3 py-2 rounded-lg border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>{locale === 'pt-br' ? 'Ver Guia Completo' : 'View Full Guide'}</span>
                            {build.author && (
                              <span className="text-xs opacity-75">by {build.author}</span>
                            )}
                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );

  function renderBuildContent(build: Build) {
    return (
      <CardContent className="p-6 flex flex-col h-full">
        {/* Description - Altura fixa */}
        <div className="min-h-[60px] mb-4">
          {build.description ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {build.description}
            </p>
          ) : (
            <div className="h-full"></div>
          )}
        </div>

        {/* Pros - Altura fixa */}
        <div className="min-h-[120px] mb-4">
              <h4 className="text-base font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
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

        {/* Cons - Altura fixa */}
        <div className="min-h-[120px] flex-1">
              <h4 className="text-base font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {locale === 'pt-br' ? 'Desvantagens' : 'Cons'}
              </h4>
          <ul className="space-y-1">
            {build.cons && build.cons.length > 0 ? (
              build.cons.map((con, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2 text-muted-foreground">
                  <span className="text-red-600 dark:text-red-400 mt-1">-</span>
                  <span>{con}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground/50 italic">
                {locale === 'pt-br' ? 'Nenhuma desvantagem significativa' : 'No significant disadvantages'}
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    );
  }
}

