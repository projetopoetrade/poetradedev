"use client";

import config from "@/sanity/config/client-config";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { getImageDimensions } from "@sanity/asset-utils";
import urlBuilder from "@sanity/image-url";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { PoeItemBlogCard } from "@/components/poe/PoeItemBlogCard";
import type { SanityPoeItem } from "@/components/poe/PoeItemBlogCard";

const ImageComponent = ({ value, isInline }: { value: any; isInline?: boolean }) => {
  const { width, height } = getImageDimensions(value);
  return (
    <div className="my-10 overflow-hidden rounded-[15px]">
      <Image
        src={
          urlBuilder(config)
            .image(value)
            .fit("max")
            .auto("format")
            .url() as string
        }
        width={width}
        height={height}
        alt={value.alt || "blog image"}
        loading="lazy"
        style={{
          display: isInline ? "inline-block" : "block",
          aspectRatio: width / height,
        }}
      />
    </div>
  );
};

const TableComponent = ({ value }: { value: any }) => {
  if (!value || !value.rows || !Array.isArray(value.rows)) {
    return null;
  }

  return (
    <div className="my-10">
      <table>
        <tbody>
          {value.rows.map((row: any) => (
            <tr key={row._key}>
              {row.cells.map((cell: any, key: any) => (
                <td
                  key={key}
                  className="first-of-type:bg-gray-100 max-w-[100px]"
                >
                  <span className="px-4">{cell}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Auto-Link Text Parser ---
const POE_CURRENCIES: Record<string, string> = {
  "divine orb": "divine-orb",
  "divine orbs": "divine-orb",
  "chaos orb": "chaos-orb",
  "chaos orbs": "chaos-orb",
  "mirror of kalandra": "mirror-of-kalandra",
  "mirrors of kalandra": "mirror-of-kalandra",
  "exalted orb": "exalted-orb",
  "exalted orbs": "exalted-orb",
  "hinekora's lock": "hinekora-s-lock",
  "hinekoras lock": "hinekora-s-lock",
  "mirror": "mirror-of-kalandra",
  "divine": "divine-orb",
  "divines": "divine-orb",
  "chaos": "chaos-orb",
};

// Regex to match any of the currency keys, case-insensitive
const currencyRegex = new RegExp(
  `\\b(${Object.keys(POE_CURRENCIES).join("|")})\\b`,
  "gi"
);

function renderTextWithLinks(text: string) {
  const parts = text.split(currencyRegex);
  return parts.map((part, i) => {
    const lowerPart = part.toLowerCase();
    if (POE_CURRENCIES[lowerPart]) {
      return (
        <Link
          key={i}
          href={`/products/${POE_CURRENCIES[lowerPart]}`}
          className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition-colors underline decoration-amber-500/30 underline-offset-2"
          title={`Buy ${part}`}
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

export const blockContentComponents: PortableTextComponents = {
  block: {
    normal: ({ children }: any) => {
      // If the children array contains strings, intercept them and wrap with Links
      const newChildren = React.Children.map(children, (child) => {
        if (typeof child === "string") {
          return renderTextWithLinks(child);
        }
        return child;
      });
      return <p className="leading-relax mb-4">{newChildren}</p>;
    },
  },
  types: {
    image: ImageComponent,
    table: TableComponent,
    poeItem: ({ value }: { value: SanityPoeItem }) => (
      <PoeItemBlogCard value={value} />
    ),
  },
};

interface BlockContentRendererProps {
  value: unknown;
}

export function BlockContentRenderer({ value }: BlockContentRendererProps) {
  if (!value) return null;
  return (
    <PortableText value={value as any} components={blockContentComponents} />
  );
}
