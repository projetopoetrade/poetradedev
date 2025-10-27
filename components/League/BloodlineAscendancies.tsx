'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { bloodlinesData } from '@/data/bloodlines';

interface Bloodline {
  name: string;
  description: string;
  source: string;
  detailedDescription?: string;
  keyFeatures?: string[];
  synergies?: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface BloodlineAscendanciesProps {
  title: string;
  subtitle: string;
  description: string;
  howItWorks: {
    title: string;
    description: string;
  };
  examples: {
    title: string;
    bloodlines: Bloodline[];
  };
  whyItMatters: {
    title: string;
    description: string;
  };
  bestPractices: {
    title: string;
    tips: string[];
  };
  faq: {
    title: string;
    questions: FAQ[];
  };
}

export default function BloodlineAscendancies({
  title,
  subtitle,
  description,
  howItWorks,
  examples,
  whyItMatters,
  bestPractices,
  faq
}: BloodlineAscendanciesProps) {
  const [expandedBloodline, setExpandedBloodline] = useState<number | null>(null);

  const toggleBloodline = (index: number) => {
    setExpandedBloodline(expandedBloodline === index ? null : index);
  };

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="space-y-12">
        {/* Header */}
        <div className="max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground mb-6">
            {subtitle}
          </p>
          <p className="text-base leading-relaxed">
            {description}
          </p>
        </div>

        {/* How It Works */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{howItWorks.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base leading-relaxed">
              {howItWorks.description}
            </CardDescription>
          </CardContent>
        </Card>

        {/* Examples */}
        <div>
          <h3 className="text-2xl font-bold mb-6">{examples.title}</h3>
          <div className="space-y-4">
            {examples.bloodlines.map((bloodline, index) => (
              <Card key={index} className="shadow-xl hover:shadow-2xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{bloodline.name}</CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          {bloodline.source}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBloodline(index)}
                      className="ml-4"
                    >
                      {expandedBloodline === index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed mb-4">
                    {bloodline.description}
                  </CardDescription>
                  
                  {expandedBloodline === index && (
                    <div className="space-y-6 pt-4 border-t">
                       {/* Bloodline Image */}
                       <div className="relative w-full h-80 md:h-[700px] rounded-lg overflow-hidden bg-muted/50">
                         {(() => {
                           // Find the bloodline data by matching the name
                           const bloodlineKey = Object.keys(bloodlinesData).find(key => 
                             bloodlinesData[key].name === bloodline.name
                           );
                           const bloodlineData = bloodlineKey ? bloodlinesData[bloodlineKey] : null;
                           
                           return bloodlineData ? (
                             <Image
                               src={bloodlineData.imageUrl}
                               alt={`${bloodline.name} Bloodline`}
                               fill
                               className="object-cover"
                               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                               priority={false}
                             />
                           ) : (
                             <div className="flex items-center justify-center h-full">
                               <div className="text-center">
                                 <div className="w-12 h-12 mx-auto mb-3 bg-primary/20 rounded-full flex items-center justify-center">
                                   <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                   </svg>
                                 </div>
                                 <p className="text-sm text-muted-foreground">
                                   {bloodline.name} Preview
                                 </p>
                               </div>
                             </div>
                           );
                         })()}
                       </div>

                      {/* Detailed Description */}
                      {bloodline.detailedDescription && (
                        <div>
                          <h4 className="font-semibold text-base mb-2">Descrição Detalhada</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {bloodline.detailedDescription}
                          </p>
                        </div>
                      )}

                      {/* Key Features */}
                      {bloodline.keyFeatures && bloodline.keyFeatures.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-base mb-3">Características Principais</h4>
                          <ul className="space-y-2">
                            {bloodline.keyFeatures.map((feature, featureIndex) => (
                              <li key={featureIndex} className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Synergies */}
                      {bloodline.synergies && bloodline.synergies.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-base mb-3">Sinergias Recomendadas</h4>
                          <ul className="space-y-2">
                            {bloodline.synergies.map((synergy, synergyIndex) => (
                              <li key={synergyIndex} className="flex items-start gap-2">
                                <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm text-muted-foreground">{synergy}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why It Matters */}
        <Card className="border-l-4 border-l-primary shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{whyItMatters.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base leading-relaxed">
              {whyItMatters.description}
            </CardDescription>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{bestPractices.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {bestPractices.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{faq.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faq.questions.map((item, index) => (
                <div key={index} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                  <h4 className="font-semibold text-base mb-2">{item.question}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
