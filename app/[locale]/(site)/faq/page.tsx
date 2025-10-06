"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Shield, Clock, CreditCard, Gamepad2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const t = useTranslations('FAQ');

  const faqCategories = [
    {
      id: "general",
      title: t('generalTitle'),
      icon: HelpCircle,
      color: "bg-blue-600",
      questions: [
        { questionKey: "question1", answerKey: "answer1" },
        { questionKey: "question2", answerKey: "answer2" },
        { questionKey: "question3", answerKey: "answer3" },
        { questionKey: "question4", answerKey: "answer4" },
        { questionKey: "question5", answerKey: "answer5" },
      ]
    },
    {
      id: "delivery",
      title: t('deliveryTitle'),
      icon: Clock,
      color: "bg-green-600",
      questions: [
        { questionKey: "delivery1", answerKey: "deliveryAnswer1" },
        { questionKey: "delivery2", answerKey: "deliveryAnswer2" },
        { questionKey: "delivery3", answerKey: "deliveryAnswer3" },
        { questionKey: "delivery4", answerKey: "deliveryAnswer4" },
      ]
    },
    {
      id: "payment",
      title: t('paymentTitle'),
      icon: CreditCard,
      color: "bg-purple-600",
      questions: [
        { questionKey: "payment1", answerKey: "paymentAnswer1" },
        { questionKey: "payment2", answerKey: "paymentAnswer2" },
        { questionKey: "payment3", answerKey: "paymentAnswer3" },
        { questionKey: "payment4", answerKey: "paymentAnswer4" },
      ]
    },
    {
      id: "safety",
      title: t('safetyTitle'),
      icon: Shield,
      color: "bg-red-600",
      questions: [
        { questionKey: "safety1", answerKey: "safetyAnswer1" },
        { questionKey: "safety2", answerKey: "safetyAnswer2" },
        { questionKey: "safety3", answerKey: "safetyAnswer3" },
        { questionKey: "safety4", answerKey: "safetyAnswer4" },
      ]
    },
    {
      id: "game",
      title: t('gameTitle'),
      icon: Gamepad2,
      color: "bg-orange-600",
      questions: [
        { questionKey: "game1", answerKey: "gameAnswer1" },
        { questionKey: "game2", answerKey: "gameAnswer2" },
        { questionKey: "game3", answerKey: "gameAnswer3" },
        { questionKey: "game4", answerKey: "gameAnswer4" },
      ]
    },
    {
      id: "support",
      title: t('supportTitle'),
      icon: MessageCircle,
      color: "bg-indigo-600",
      questions: [
        { questionKey: "support1", answerKey: "supportAnswer1" },
        { questionKey: "support2", answerKey: "supportAnswer2" },
        { questionKey: "support3", answerKey: "supportAnswer3" },
        { questionKey: "support4", answerKey: "supportAnswer4" },
      ]
    }
  ];

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
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
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.id} className="p-8">
                <div className="space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold">{category.title}</h2>
                  </div>

                  {/* FAQ Items */}
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, index) => (
                      <AccordionItem key={index} value={`${category.id}-${index}`}>
                        <AccordionTrigger className="text-left font-medium">
                          {t(item.questionKey)}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {t(item.answerKey)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Contact Support */}
        <Card className="p-8 bg-primary/5 border-primary/20">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-semibold">{t('stillNeedHelp')}</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('contactDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link href="/contact" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {t('contactUs')}
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/support/tickets" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('createTicket')}
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
