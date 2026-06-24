import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/interface";
import { getProductUrl } from "@/utils/url-helper";

interface Props {
  product: Product;
  locale: string;
  buyLabel: string;
  outOfStockLabel: string;
}

export default function CategoryItemCard({ product, locale, buyLabel, outOfStockLabel }: Props) {
  const href = getProductUrl(product.name, locale, undefined, undefined, product.gameVersion);
  const isInStock = product.in_stock !== false;

  return (
    <Link href={href} className="group block h-full">
      <div className="h-full flex flex-col bg-card border border-border/40 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
        {/* Image area */}
        <div className="relative bg-black/25 p-3 flex items-center justify-center aspect-square">
          <Image
            src={product.imgUrl}
            alt={product.name}
            width={96}
            height={96}
            className="object-contain group-hover:scale-105 transition-transform duration-300 max-h-[88px]"
            quality={90}
          />
          {!isInStock && (
            <span className="absolute top-2 right-2 text-xs bg-red-600/80 text-white px-1.5 py-0.5 rounded font-medium">
              {outOfStockLabel}
            </span>
          )}
        </div>

        {/* Info area */}
        <div className="flex flex-col flex-1 p-3 gap-2">
          <h3 className="text-sm font-medium leading-tight line-clamp-2 flex-1">
            {product.name}
          </h3>
          <div className="flex items-center justify-between gap-1 mt-auto">
            {isInStock && product.price > 0 ? (
              <span className="text-sm font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{outOfStockLabel}</span>
            )}
            <span className="text-xs font-semibold text-primary bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground px-2.5 py-1 rounded-lg transition-colors">
              {buyLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
