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

  // Structured data for FAQ page
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      // General Questions
      {
        "@type": "Question",
        name: "What is Path of Exile?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Path of Exile is a free-to-play action RPG developed by Grinding Gear Games, famous for its complex in-game economy—which is where we come in to help!"
        }
      },
      {
        "@type": "Question",
        name: "What kind of Path of Exile currency, services, and items do you sell?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We offer a comprehensive range of products for Path of Exile! Our catalog includes: PoE currency (Divine Orbs, Chaos Orbs, Exalted Orbs, Mirrors of Kalandra, and more), Unique Items, and Services (power leveling and expert build creation)."
        }
      },
      {
        "@type": "Question",
        name: "Which Path of Exile league do you sell items for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We support both the permanent Standard league and the current seasonal Challenge League. Please double-check that you've selected the correct league before completing your purchase."
        }
      },
      // Delivery Questions
      {
        "@type": "Question",
        name: "How fast is the delivery?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most orders are delivered within 30 minutes during business hours. During peak times or high demand periods, delivery may take up to 2 hours."
        }
      },
      {
        "@type": "Question",
        name: "How does the in-game delivery work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "After payment confirmation, our trader will contact you in-game using the character name and league you provided. You'll meet at a designated location (usually in town) and complete the trade."
        }
      },
      // Payment Questions
      {
        "@type": "Question",
        name: "What payment methods do you accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We accept major credit cards (Visa, MasterCard, American Express), PayPal, and various cryptocurrencies including Bitcoin, Ethereum, and other popular digital currencies."
        }
      },
      {
        "@type": "Question",
        name: "Is my payment information safe?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely! We use industry-standard encryption and never store your payment information. All transactions are processed through secure, PCI-compliant payment gateways."
        }
      },
      // Safety Questions
      {
        "@type": "Question",
        name: "Is it safe to buy from you?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! We've been in business for years with thousands of satisfied customers. We use secure trading methods and have strict policies to protect both buyers and sellers."
        }
      },
      {
        "@type": "Question",
        name: "How do you ensure safe trading to avoid account issues?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "We use the most advanced and safest trading methods available in Path of Exile. Our experienced traders follow strict protocols to ensure all transactions appear as legitimate player-to-player trades."
        }
      }
    ]
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
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
