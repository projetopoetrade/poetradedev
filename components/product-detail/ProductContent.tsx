import config from "@/sanity/config/client-config";
import { PortableText } from "@portabletext/react";
import { getImageDimensions } from "@sanity/asset-utils";
import urlBuilder from "@sanity/image-url";
import Image from "next/image";

// Image component for Sanity images
const ImageComponent = ({ value, isInline }: any) => {
  const { width, height } = getImageDimensions(value);
  return (
    <div className="my-6 overflow-hidden rounded-lg">
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
        alt={value.alt || "product image"}
        loading="lazy"
        className="object-cover"
        style={{
          display: isInline ? "inline-block" : "block",
          aspectRatio: width / height,
        }}
      />
    </div>
  );
};

// Table component for structured data
const Table = ({ value }: any) => {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse">
        <tbody>
          {value.rows.map((row: any) => (
            <tr key={row._key} className="border-b border-gray-200">
              {row.cells.map((cell: any, key: any) => (
                <td
                  key={key}
                  className="py-2 px-4 first-of-type:bg-gray-100/10"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const components = {
  types: {
    image: ImageComponent,
    table: Table,
  },
  block: {
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-semibold mb-3">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-semibold mb-2">{children}</h3>,
    normal: ({ children }: any) => <p className="mb-4 text-gray-300 leading-relaxed">{children}</p>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-gray-500 pl-4 my-4 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
  },
};

interface ProductContentProps {
  content: any;
}

const ProductContent = ({ content }: ProductContentProps) => {
  if (!content) return null;

  return (
    <div className="prose prose-invert max-w-none">
      <PortableText value={content} components={components} />
    </div>
  );
};

export default ProductContent; 