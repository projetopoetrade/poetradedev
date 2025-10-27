'use client';

import React from 'react';

interface TOCItem {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  title: string;
  items: TOCItem[];
}

export default function TableOfContents({ title, items }: TableOfContentsProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {title}
      </h2>
      
      <nav className="border-l-2 border-primary/20 pl-4 space-y-2 max-w-2xl">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(item.id)}
            className="flex items-center gap-3 text-left w-full py-2 px-3 group"
          >
            <span className="text-sm font-bold text-primary min-w-[24px]">{index + 1}.</span>
            <span className="text-sm font-medium group-hover:text-primary transition-colors">
              {item.title}
            </span>
          </button>
        ))}
      </nav>
    </section>
  );
}

