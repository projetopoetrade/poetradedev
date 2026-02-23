import { PortableText } from "@portabletext/react";
import config from "@/sanity/config/client-config";
import urlBuilder from "@sanity/image-url";
import Image from "next/image";
import { getImageDimensions } from "@sanity/asset-utils";

const ImageComponent = ({ value, isInline }: any) => {
  const { width, height } = getImageDimensions(value);
  return (
    <div className="my-8 overflow-hidden rounded-lg">
      <Image
        src={urlBuilder(config).image(value).fit("max").auto("format").url() as string}
        width={width}
        height={height}
        alt={value.alt || "league image"}
        loading="lazy"
        style={{ display: isInline ? "inline-block" : "block", aspectRatio: width / height }}
      />
    </div>
  );
};

const components = {
  types: { image: ImageComponent },
  block: {
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-bold mt-8 mb-3 text-foreground">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold mt-6 mb-2 text-foreground">{children}</h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-lg font-semibold mt-4 mb-2 text-foreground">{children}</h4>
    ),
    normal: ({ children }: any) => (
      <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => (
      <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">{children}</ul>
    ),
  },
  listItem: {
    bullet: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }: any) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }: any) => <em className="italic">{children}</em>,
    link: ({ value, children }: any) => (
      <a
        href={value?.href}
        target={value?.blank ? "_blank" : undefined}
        rel={value?.blank ? "noopener noreferrer" : undefined}
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
      >
        {children}
      </a>
    ),
  },
};

export default function LeaguePortableText({ content }: { content: any[] }) {
  if (!content || content.length === 0) return null;
  return (
    <div className="prose-league">
      <PortableText value={content} components={components} />
    </div>
  );
}
