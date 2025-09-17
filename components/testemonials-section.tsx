import * as React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";

interface Testimonial {
  name: string;
  title: string;
  description: string;
  rating: number;
}

export default function TestimonialCarousel() {
  const testimonials: Testimonial[] = [
    
      {
        "name": "ExileSlayer_92",
        "title": "Fastest Orbs in Wraeclast!",
        "description":
          "I was skeptical at first, but pathoftrade.net delivered my Divine Orbs in less than 5 minutes after payment. The whole process was incredibly fast and smooth. I'll definitely be back for the next league start!",
        "rating": 5
      },
      {
        "name": "MappingManiac",
        "title": "Trustworthy and Secure",
        "description":
          "Security is my biggest concern when buying currency, and pathoftrade.net handled it perfectly. The transaction felt safe, and the communication for the in-game trade was professional. Highly recommend for a worry-free experience.",
        "rating": 5
      },
      {
        "name": "ChaosQueen",
        "title": "The Best Prices for Bulking",
        "description":
          "I've shopped around, and the prices here are consistently the best, especially when you're buying in bulk. I got a great deal on my Chaos Orbs, which helped me finish my build way sooner than I expected. Great value!",
        "rating": 5
      },
      {
        "name": "Hardcore_Hero",
        "title": "Incredible Customer Support",
        "description":
          "I had a small issue with my order details, and the support team on pathoftrade.net was amazing. They responded to my ticket within minutes and sorted everything out politely and efficiently. A+ service!",
        "rating": 5
      },
      {
        "name": "JustAnotherTuna",
        "title": "Super Simple and Easy to Use",
        "description":
          "The website is so easy to navigate. Found the currency I needed for my server, paid, and got instructions for the trade right away. The entire process from start to finish is streamlined for gamers. No hassle at all.",
        "rating": 5
      }
    ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        fill={index < rating ? "currentColor" : "none"}
        className="w-6 h-6 text-yellow-400"
        strokeWidth={1.5}
      />
    ));
  };

  const t = useTranslations('Testemonials');
  return (
    <section className="w-full py-16 bg-background mb-16">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-source font-black text-left mb-8 text-white">
          {t('title')}
        </h2>

        <Carousel
          opts={{
            align: "start",
            loop: true,
            skipSnaps: false,
          }}
          className="w-full relative"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial, index) => (
              <CarouselItem
                key={index}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                aria-label={`Testimonial ${index + 1} of ${testimonials.length}`}
              >
                <div className="p-1 h-full">
                  <Card className="h-full bg-background hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 group">
                    <CardContent className="flex flex-col items-start p-6 gap-4 h-full">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                        <div>
                          <h2 className="font-source text-xl font-bold text-white">
                            {testimonial.name}
                          </h2>
                          <div className="flex gap-1">
                            {renderStars(testimonial.rating)}
                          </div>
                        </div>
                      </div>

                      <CardTitle className="text-xl font-bold text-primary-font mb-2">
                        {testimonial.title}
                      </CardTitle>

                      <p className="text-gray-300 font-normal text-base line-clamp-5">
                        {testimonial.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation Controls */}
          <div className="mt-8 flex justify-center gap-4">
            <CarouselPrevious
              className="static translate-x-0 translate-y-0 bg-gray-800 hover:bg-gray-700 text-white"
              aria-label="Previous testimonial"
            />
            <CarouselNext
              className="static translate-x-0 translate-y-0 bg-gray-800 hover:bg-gray-700 text-white"
              aria-label="Next testimonial"
            />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
