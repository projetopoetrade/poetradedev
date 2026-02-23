import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface LeagueHeroProps {
  title: string;
  subtitle: string;
  version: string;
  releaseDate: string;
  imageUrl?: string;
  locale: string;
  status?: 'announced' | 'live' | 'ended';
  liveLabel?: string;
  endedLabel?: string;
}

export default function LeagueHero({
  title,
  subtitle,
  version,
  releaseDate,
  imageUrl,
  locale,
  status,
  liveLabel,
  endedLabel,
}: LeagueHeroProps) {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Image */}
      {imageUrl && (
        <div className="absolute inset-0 z-0">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Badges row */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {version && (
              <Badge variant="outline" className="text-sm font-semibold">
                {locale === 'pt-br' ? 'Versão' : 'Version'} {version}
              </Badge>
            )}
            {status === 'live' && liveLabel && (
              <Badge className="text-sm font-bold bg-green-500 hover:bg-green-500 text-white border-0 animate-pulse">
                {liveLabel}
              </Badge>
            )}
            {status === 'ended' && endedLabel && (
              <Badge variant="secondary" className="text-sm font-semibold">
                {endedLabel}
              </Badge>
            )}
            {status === 'announced' && (
              <Badge className="text-sm font-semibold bg-amber-500 hover:bg-amber-500 text-white border-0">
                {locale === 'pt-br' ? 'Anunciada' : 'Announced'}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}

          {/* Release Date */}
          {releaseDate && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <time className="text-base">{releaseDate}</time>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

