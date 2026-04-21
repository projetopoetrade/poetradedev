"use client";

import config from "@/sanity/config/client-config";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { getImageDimensions } from "@sanity/asset-utils";
import urlBuilder from "@sanity/image-url";
import { Lexer } from "marked";
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
};

// Regex to match any of the currency keys, case-insensitive
const currencyRegex = new RegExp(
  `\\b(${Object.keys(POE_CURRENCIES).join("|")})\\b`,
  "gi"
);

function applyCurrencyLinks(text: string, baseKey: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(currencyRegex);
  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    if (POE_CURRENCIES[lower]) {
      return (
        <Link
          key={`${baseKey}-c-${i}`}
          href={`/products/${POE_CURRENCIES[lower]}`}
          className="text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition-colors underline decoration-amber-500/30 underline-offset-2"
          title={`Buy ${part}`}
        >
          {part}
        </Link>
      );
    }
    return <React.Fragment key={`${baseKey}-t-${i}`}>{part}</React.Fragment>;
  });
}

function renderInlineToken(tok: any, key: string): React.ReactNode {
  switch (tok.type) {
    case "strong":
      return <strong key={key} className="font-bold text-white">{renderInlineTokens(tok.tokens, key)}</strong>;
    case "em":
      return <em key={key}>{renderInlineTokens(tok.tokens, key)}</em>;
    case "codespan":
      return <code key={key} className="bg-gray-800 px-1.5 py-0.5 rounded text-amber-400 text-sm">{tok.text}</code>;
    case "link":
      return (
        <a key={key} href={tok.href} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400 underline underline-offset-2">
          {renderInlineTokens(tok.tokens, key)}
        </a>
      );
    case "del":
      return <s key={key}>{renderInlineTokens(tok.tokens, key)}</s>;
    case "br":
      return <br key={key} />;
    case "html":
      return null;
    case "escape":
      return <React.Fragment key={key}>{tok.text}</React.Fragment>;
    case "text":
    default:
      return <React.Fragment key={key}>{applyCurrencyLinks(tok.text ?? "", key)}</React.Fragment>;
  }
}

function renderInlineTokens(tokens: any[] | undefined, baseKey: string): React.ReactNode[] {
  if (!tokens) return [];
  return tokens.map((tok, i) => renderInlineToken(tok, `${baseKey}-${i}`));
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  try {
    const tokens = Lexer.lexInline(text);
    return renderInlineTokens(tokens, "inl");
  } catch {
    return applyCurrencyLinks(text, "inl-fallback");
  }
}

function renderTextWithLinks(text: string): React.ReactNode[] {
  return renderInlineMarkdown(text);
}

function processChildren(children: React.ReactNode) {
  return React.Children.map(children, (child) => {
    if (typeof child === "string") {
      return renderTextWithLinks(child);
    }
    return child;
  });
}

function getTextParts(children: React.ReactNode): { first: string | null; full: string | null } {
  const childArray = React.Children.toArray(children);
  const textParts: string[] = [];
  for (const child of childArray) {
    if (typeof child === "string") {
      textParts.push(child);
    }
    // Non-string children (like <br/>) act as line separators
  }
  const first = textParts.find(t => t.trim())?.trim() || null;
  // Join with newline to reconstruct multiline content (PortableText splits \n into separate children with <br/>)
  const full = textParts.length > 0 ? textParts.join('\n').trim() : null;
  return { first, full };
}

function renderMarkdownTable(text: string) {
  const lines = text.split('\n').filter(l => l.trim());
  const dataRows = lines.filter(l => {
    const trimmed = l.trim();
    // Skip separator rows like | :--- | :--- |
    return !(trimmed.match(/^\|[\s:-]+\|/) && !trimmed.replace(/[\s|:-]/g, ''));
  });

  if (dataRows.length === 0) return null;

  const headerCells = dataRows[0].split('|').filter(c => c.trim() !== '');
  const colCount = headerCells.length;

  return (
    <div className="mb-6 ml-4 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700/50">
            {headerCells.map((cell, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-gray-200">
                {renderTextWithLinks(cell.trim())}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.slice(1).map((row, ri) => {
            const cells = row.split('|').filter(c => c.trim() !== '');
            return (
              <tr key={ri} className="border-b border-gray-800/30">
                {Array.from({ length: colCount }, (_, ci) => (
                  <td key={ci} className="px-4 py-2.5 text-gray-300">
                    {cells[ci] ? renderTextWithLinks(cells[ci].trim()) : ''}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function processNormalBlock(children: React.ReactNode) {
  const { first: firstText, full: fullText } = getTextParts(children);

  if (firstText) {
    // Horizontal rule: --- or *** or ___
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(firstText)) {
      return <hr className="my-8 border-gray-800/50" />;
    }

    // Table separator row (single line | :--- | :--- |) — skip rendering
    if (/^\|[\s:-]+\|/.test(firstText) && !firstText.replace(/[\s|:-]/g, '')) {
      return null;
    }

    // Markdown table
    if (/^\|.+\|/.test(firstText) && fullText) {
      const tableLines = fullText.split('\n').filter(l => l.trim().startsWith('|'));
      if (tableLines.length > 1) {
        return renderMarkdownTable(fullText);
      }
      // Single-line table row
      const cells = firstText.split('|').filter(c => c.trim() !== '');
      if (cells.length > 0) {
        return (
          <div className="grid gap-px bg-gray-700/50 rounded overflow-hidden mb-px" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
            {cells.map((cell, i) => (
              <div key={i} className="bg-gray-900/80 px-3 py-2 text-sm text-gray-300">
                {renderTextWithLinks(cell.trim())}
              </div>
            ))}
          </div>
        );
      }
    }

    // Markdown headings — only match if the ENTIRE first text child is a heading
    const headingMatch = firstText.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 4);
      const headingText = headingMatch[2];
      const content = renderTextWithLinks(headingText);
      const headingClasses: Record<number, string> = {
        1: "text-3xl font-bold mt-10 mb-4 text-white",
        2: "text-2xl font-bold mt-8 mb-3 text-white",
        3: "text-xl font-semibold mt-6 mb-2 text-white",
        4: "text-lg font-semibold mt-4 mb-2 text-white",
      };
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;

      // Check if there's additional content after the heading (other children)
      const childArray = React.Children.toArray(children);
      const remainingChildren = childArray.slice(1).filter(c => !(typeof c === "string" && !c.trim()));
      if (remainingChildren.length > 0) {
        return (
          <>
            <Tag className={headingClasses[level]}>{content}</Tag>
            <p className="leading-relax mb-4">{processChildren(remainingChildren)}</p>
          </>
        );
      }
      return <Tag className={headingClasses[level]}>{content}</Tag>;
    }

    // Markdown list — every line is a bullet (`*` / `-`) or numbered (`1.`).
    // The LLM-imported posts often dump list items as a single paragraph with
    // newlines, which would otherwise render as a literal "- foo" run-on.
    if (fullText && fullText.includes("\n")) {
      const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const isOrdered = lines.every((l) => /^\d+\.\s+/.test(l));
        const isBullet = lines.every((l) => /^[*-]\s+/.test(l));
        if (isOrdered || isBullet) {
          const items = lines.map((l) => l.replace(/^(?:\d+\.|[*-])\s+/, ""));
          if (isOrdered) {
            return (
              <ol className="list-decimal pl-6 mb-4 space-y-1">
                {items.map((item, i) => (
                  <li key={i} className="text-gray-300">{renderTextWithLinks(item)}</li>
                ))}
              </ol>
            );
          }
          return (
            <ul className="list-disc pl-6 mb-4 space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-gray-300">{renderTextWithLinks(item)}</li>
              ))}
            </ul>
          );
        }
      }
    }
  }

  return <p className="leading-relax mb-4">{processChildren(children)}</p>;
}

export const blockContentComponents: PortableTextComponents = {
  block: {
    normal: ({ children }: any) => processNormalBlock(children),
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-10 mb-4 text-white">{processChildren(children)}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold mt-8 mb-3 text-white">{processChildren(children)}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-semibold mt-6 mb-2 text-white">{processChildren(children)}</h3>,
    h4: ({ children }: any) => <h4 className="text-lg font-semibold mt-4 mb-2 text-white">{processChildren(children)}</h4>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-amber-500/50 pl-4 my-4 italic text-gray-300">{processChildren(children)}</blockquote>,
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li className="text-gray-300">{processChildren(children)}</li>,
    number: ({ children }: any) => <li className="text-gray-300">{processChildren(children)}</li>,
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-bold text-white">{children}</strong>,
    em: ({ children }: any) => <em>{children}</em>,
    code: ({ children }: any) => <code className="bg-gray-800 px-1.5 py-0.5 rounded text-amber-400 text-sm">{children}</code>,
    link: ({ value, children }: any) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400 underline underline-offset-2">
        {children}
      </a>
    ),
    // Inline PoE item reference — injected by the placeholder resolver for
    // `{{item:Name}}`. Renders the same icon+tooltip combo used by
    // Sanity-authored `poeItem` blocks, but inline inside the paragraph.
    poeItem: ({ value }: any) => {
      if (!value?.rawText) return null;
      return <PoeItemBlogCard value={{ _type: 'poeItem', rawText: value.rawText, iconUrl: value.iconUrl }} />;
    },
    // Currency / fragment chip — icon + linked name, no tooltip. Used for
    // items whose tooltip would be a generic "Right click to use" stub.
    iconLink: ({ value, children }: any) => {
      const href = value?.href || '#';
      const iconUrl = value?.iconUrl as string | null | undefined;
      return (
        <Link
          href={href}
          className="inline-flex items-center gap-1 align-baseline text-amber-500 hover:text-amber-400 underline underline-offset-2 decoration-amber-500/40"
          title={value?.name ? `View ${value.name}` : undefined}
        >
          {iconUrl && (
            <Image
              src={iconUrl}
              alt=""
              width={20}
              height={20}
              unoptimized
              className="inline-block w-5 h-5 align-text-bottom"
            />
          )}
          {children}
        </Link>
      );
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
