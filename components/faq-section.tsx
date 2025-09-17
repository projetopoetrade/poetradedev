import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslations } from "next-intl";
export function FaqSection() {
  const  t = useTranslations("faq");
  return (
    <section className=" container mx-auto mb-16 bg-background">
      <div className="grid md:grid-cols-2 mx-auto ">
        <div className="flex flex-col">
          <h2 className="text-6xl font-bold  font-source text-left mb-4 text-primary-font">
            FAQ
          </h2>
          <span className=" font-inter font-black text-primary text-lg tracking-wider">
            {t("answers-to-some-questions")}
          </span>
        </div>

        <Accordion type={"single"} collapsible className="w-full">
          <AccordionItem value="item 1">
            <AccordionTrigger className=" font-inter font-bold text-bold  px-4 text-lg">
              {t("question1")}
            </AccordionTrigger>
            <AccordionContent className="font-inter px-4 text-base">
              {t("answer1")}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item 2">
            <AccordionTrigger className=" font-inter font-bold text-bold  px-4 text-lg">
              {t("question2")}
            </AccordionTrigger>
            <AccordionContent className="font-inter px-4 text-base">
              {t("answer2")}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item 3">
            <AccordionTrigger className=" font-inter font-bold text-bold  px-4 text-lg">
              {t("question3")}
            </AccordionTrigger>
            <AccordionContent className="font-inter px-4 text-base">
              {t("answer3")}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item 4">
            <AccordionTrigger className=" font-inter font-bold text-bold  px-4 text-lg">
              {t("question4")}
            </AccordionTrigger>
            <AccordionContent className="font-inter px-4 text-base">
              {t("answer4")}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item 5">
            <AccordionTrigger className=" font-inter font-bold text-bold  px-4 text-lg">
              {t("question5")}
            </AccordionTrigger>
            <AccordionContent className="font-inter px-4 text-base">
              {t("answer5")}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
