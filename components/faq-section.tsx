import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "next-intl";

// 1. Crie um array com os dados do seu FAQ
const faqItems = [
  {
    questionKey: "question1",
    answerKey: "answer1",
  },
  {
    questionKey: "question2",
    answerKey: "answer2",
  },
  {
    questionKey: "question3",
    answerKey: "answer3",
  },
  {
    questionKey: "question4",
    answerKey: "answer4",
  },
  {
    questionKey: "question5",
    answerKey: "answer5",
  },
];

export function FaqSection() {
  const t = useTranslations("faq");

  return (
    <section className="container mx-auto mb-16 bg-background">
      <div className="grid md:grid-cols-2 mx-auto gap-x-12 gap-y-8">
        <div className="flex flex-col">
          {/* O título responsivo que fizemos antes */}
          <h2 className="text-4xl md:text-6xl font-bold font-source text-left mb-4 text-primary-font">
            FAQ
          </h2>
          <span className="font-inter font-black text-primary text-lg tracking-wider">
            {t("answers-to-some-questions")}
          </span>
        </div>

        <Accordion type={"single"} collapsible className="w-full">
          {/* 2. Use .map() para renderizar os itens dinamicamente */}
          {faqItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              {/* 3. Ajustado o tamanho da fonte da pergunta */}
              <AccordionTrigger className="font-inter font-bold px-4 text-base text-left">
                {t(item.questionKey)}
              </AccordionTrigger>
              {/* 4. Ajustado o tamanho da fonte da resposta */}
              <AccordionContent className="font-inter px-4 text-sm">
                {t(item.answerKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}