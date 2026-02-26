"use client";

import config from "@/sanity/config/client-config";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { getImageDimensions } from "@sanity/asset-utils";
import urlBuilder from "@sanity/image-url";
import Image from "next/image";
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

export const blockContentComponents: PortableTextComponents = {
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
