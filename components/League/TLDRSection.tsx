import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TLDRItem {
  text: string;
  type?: 'buff' | 'nerf' | 'new' | 'neutral';
}

interface TLDRSectionProps {
  title: string;
  items: TLDRItem[];
}

export default function TLDRSection({ title, items }: TLDRSectionProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl flex items-center gap-3">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <p className="text-sm md:text-base leading-relaxed text-card-foreground">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
        </CardContent>
      </Card>
    </section>
  );
}

