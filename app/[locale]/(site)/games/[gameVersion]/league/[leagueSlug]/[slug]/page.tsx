import { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { getProductsWithParams, getAllActiveLeagues, getLeagueBySlugFromSupabase } from "@/app/actions";
import { generateKeywords, buildBreadcrumbSchema } from "@/lib/utils";
import { encodeProductName } from "@/utils/url-helper";
import CategoryItemCard from "@/components/category-item-card";
import type { Product } from "@/lib/interface";

export const revalidate = 300;

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = ["currency", "items", "services"] as const;
type CategorySlug = (typeof CATEGORIES)[number];

const KEY_PRODUCTS = ["divine-orb", "chaos-orb", "mirror-of-kalandra"] as const;
type KeyProductSlug = (typeof KEY_PRODUCTS)[number];

const categoryDbValue: Record<CategorySlug, string> = {
  currency: "Currency",
  items: "Items",
  services: "Services",
};

const categoryLabels: Record<CategorySlug, { en: string; "pt-br": string }> = {
  currency: { en: "Currency", "pt-br": "Moedas" },
  items: { en: "Items", "pt-br": "Itens" },
  services: { en: "Services", "pt-br": "Serviços" },
};

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.pathoftrade.net"
).replace(/\/+$/, "");

// ─── Curated copy ─────────────────────────────────────────────────────────────
// meta  → used in <meta description> (~155 chars max, no price)
// body  → used in page intro paragraph (richer, may include price)

type DescFn = (league: string, price?: string) => string;
interface CopyPair { meta: DescFn; body: DescFn }
type LocaleCopy = { en: CopyPair; "pt-br": CopyPair };
type CopyMap = { "path-of-exile-1": LocaleCopy; "path-of-exile-2": LocaleCopy };

const productCopy: Record<KeyProductSlug, CopyMap> = {
  "divine-orb": {
    "path-of-exile-1": {
      en: {
        meta: (l) =>
          `Buy Divine Orbs for the ${l} league in Path of Exile 1 — reroll explicit modifier values on rare and unique items. Fast in-game delivery.`,
        body: (l, p) =>
          `Divine Orbs are the most in-demand currency in ${l} for rerolling explicit modifier values on rare and unique items. They set the standard for high-end crafting and top-tier trades${p ? ` — current price: $${p}` : ""}. Buy securely at Path of Trade and receive delivery in-game within minutes.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre Divine Orbs para a liga ${l} em Path of Exile 1 — rerrole modificadores em itens raros e únicos. Entrega rápida no jogo.`,
        body: (l, p) =>
          `Divine Orbs são a moeda mais procurada em ${l} para rerolar os valores de modificadores explícitos em itens raros e únicos. São a referência para craft de alto nível e negociações de ponta${p ? ` — preço atual: $${p}` : ""}. Compre com segurança no Path of Trade e receba no jogo em minutos.`,
      },
    },
    "path-of-exile-2": {
      en: {
        meta: (l) =>
          `Buy Divine Orbs for the ${l} league in Path of Exile 2 — cornerstone endgame crafting currency. Secure purchase and fast in-game delivery.`,
        body: (l, p) =>
          `In Path of Exile 2, Divine Orbs reroll modifier values on items, making them the cornerstone of ${l} endgame crafting. Demand stays high as players push pinnacle content${p ? ` — current price: $${p}` : ""}. Secure yours at Path of Trade with guaranteed fast delivery.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre Divine Orbs para a liga ${l} em Path of Exile 2 — moeda essencial de endgame. Compra segura e entrega rápida no jogo.`,
        body: (l, p) =>
          `Em Path of Exile 2, Divine Orbs rerrolam valores de modificadores em itens, tornando-os o alicerce do craft de endgame em ${l}. A demanda se mantém alta conforme os jogadores avançam no conteúdo de pináculo${p ? ` — preço atual: $${p}` : ""}. Garanta os seus no Path of Trade com entrega rápida garantida.`,
      },
    },
  },

  "chaos-orb": {
    "path-of-exile-1": {
      en: {
        meta: (l) =>
          `Buy Chaos Orbs for the ${l} league in Path of Exile 1 — the backbone of in-game trading and crafting. Bulk available, fast delivery.`,
        body: (l, p) =>
          `Chaos Orbs are the backbone of the ${l} trading economy — the standard unit of exchange for most item transactions and a crafting tool that rerolls all modifiers on a rare item${p ? `. Current price: $${p}` : ""}. Whether stocking up for crafting sessions or bulk trading, Path of Trade has you covered.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre Chaos Orbs para a liga ${l} em Path of Exile 1 — a espinha dorsal das trocas e crafting. Volume disponível, entrega rápida.`,
        body: (l, p) =>
          `Chaos Orbs são a espinha dorsal da economia de trocas em ${l} — a unidade padrão de câmbio para a maioria das transações e uma ferramenta que rerola todos os modificadores de um item raro${p ? `. Preço atual: $${p}` : ""}. Seja para sessões de craft ou compras em volume, o Path of Trade tem o que você precisa.`,
      },
    },
    "path-of-exile-2": {
      en: {
        meta: (l) =>
          `Buy Chaos Orbs for the ${l} league in Path of Exile 2 — universal trade currency and crafting staple. Fast, secure in-game delivery.`,
        body: (l, p) =>
          `In Path of Exile 2, Chaos Orbs remain a pillar of the ${l} economy — both a crafting tool and a universal medium of exchange. Stocking up early in the league unlocks better gear and profitable trade opportunities${p ? `. Current price: $${p}` : ""}. Order now for fast in-game delivery.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre Chaos Orbs para a liga ${l} em Path of Exile 2 — moeda universal de troca e craft essencial. Entrega segura e rápida.`,
        body: (l, p) =>
          `Em Path of Exile 2, Chaos Orbs continuam sendo um pilar da economia de ${l}, servindo como ferramenta de craft e meio universal de troca. Acumular Chaos cedo na liga abre portas para gear melhor e oportunidades lucrativas${p ? `. Preço atual: $${p}` : ""}. Faça seu pedido para entrega rápida no jogo.`,
      },
    },
  },

  "mirror-of-kalandra": {
    "path-of-exile-1": {
      en: {
        meta: (l) =>
          `Buy a Mirror of Kalandra for the ${l} league in Path of Exile 1 — the rarest currency, creates a perfect duplicate of any non-unique item.`,
        body: (l, p) =>
          `The Mirror of Kalandra is the rarest and most coveted currency in ${l} — it creates a perfect duplicate of any non-unique item while keeping the original intact. Whether mirroring a flawlessly crafted weapon or investing in the ${l} economy${p ? `, priced at $${p}` : ""}, Path of Trade offers discreet and secure delivery.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre Mirror of Kalandra para a liga ${l} em Path of Exile 1 — a moeda mais rara do jogo, duplica qualquer item não-único.`,
        body: (l, p) =>
          `O Mirror of Kalandra é a moeda mais rara e cobiçada de ${l} — cria uma cópia perfeita de qualquer item não-único, mantendo o original intacto. Seja para espelhar uma arma craftada com perfeição ou investir na economia de ${l}${p ? `, disponível por $${p}` : ""}, o Path of Trade oferece entrega discreta e segura.`,
      },
    },
    "path-of-exile-2": {
      en: {
        meta: (l) =>
          `Buy a Mirror of Kalandra for the ${l} league in Path of Exile 2 — duplicate the perfect item and maximize your endgame power.`,
        body: (l, p) =>
          `In Path of Exile 2, the Mirror of Kalandra holds its legendary status as the ultimate endgame investment in ${l}. Duplicating the perfect item grants lasting power across multiple build iterations${p ? ` — priced at $${p}` : ""}. Buy yours securely at Path of Trade with guaranteed fast delivery.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre Mirror of Kalandra para a liga ${l} em Path of Exile 2 — duplique o item perfeito e maximize seu poder de endgame.`,
        body: (l, p) =>
          `Em Path of Exile 2, o Mirror of Kalandra mantém seu status lendário como o investimento definitivo de endgame em ${l}. Duplicar o item perfeito garante poder duradouro em múltiplas builds${p ? ` — disponível por $${p}` : ""}. Compre o seu com segurança no Path of Trade com entrega garantida.`,
      },
    },
  },
};

const categoryCopy: Record<CategorySlug, CopyMap> = {
  currency: {
    "path-of-exile-1": {
      en: {
        meta: (l) =>
          `Buy Path of Exile 1 currency for the ${l} league — Divine Orbs, Chaos Orbs, Exalted Orbs and more. Daily updated prices and fast in-game delivery.`,
        body: (l) =>
          `Browse the full selection of Path of Exile 1 currency for ${l} — Divine Orbs, Chaos Orbs, Exalted Orbs and every crafting material you need to progress. All listings are in-league, updated daily to match the ${l} economy, and delivered via the official in-game trade window.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre moedas de Path of Exile 1 para a liga ${l} — Divine Orbs, Chaos Orbs, Exalted Orbs e muito mais. Preços atualizados diariamente.`,
        body: (l) =>
          `Navegue pela seleção completa de moedas de Path of Exile 1 para ${l} — Divine Orbs, Chaos Orbs, Exalted Orbs e todos os materiais de craft que você precisa para progredir. Todos os itens são da liga, atualizados diariamente para refletir a economia de ${l}, e entregues pela janela de troca oficial do jogo.`,
      },
    },
    "path-of-exile-2": {
      en: {
        meta: (l) =>
          `Buy Path of Exile 2 currency for the ${l} league — fast-moving economy, daily price updates and in-game delivery within 30 minutes.`,
        body: (l) =>
          `Stock up on Path of Exile 2 currency for ${l} — from essential crafting orbs to high-value trade currency. The PoE 2 economy moves fast and prices shift daily; our ${l} listings are always up to date so you get fair pricing and guaranteed in-game delivery within 30 minutes.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre moedas de Path of Exile 2 para a liga ${l} — economia dinâmica, preços atualizados e entrega no jogo em até 30 minutos.`,
        body: (l) =>
          `Abastecça-se com moedas de Path of Exile 2 para ${l} — de orbs essenciais de craft à currency de alto valor para troca. A economia de PoE 2 se move rápido; nossas listagens de ${l} são sempre atualizadas para garantir preços justos e entrega no jogo em até 30 minutos.`,
      },
    },
  },

  items: {
    "path-of-exile-1": {
      en: {
        meta: (l) =>
          `Buy Path of Exile 1 items for the ${l} league — unique weapons, armor, jewels and endgame gear. Hand-selected and verified, fast delivery.`,
        body: (l) =>
          `Find hand-selected Path of Exile 1 items for the ${l} league — unique weapons, powerful body armour, high-quality flasks, rare jewels and endgame gear. Every item is verified before listing. Skip the RNG grind and gear up for ${l} endgame content with fast in-game delivery.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre itens de Path of Exile 1 para a liga ${l} — armas únicas, armaduras, joias e gear de endgame. Selecionados e verificados, entrega rápida.`,
        body: (l) =>
          `Encontre itens selecionados de Path of Exile 1 para a liga ${l} — armas únicas, armaduras poderosas, frascos de alta qualidade, joias raras e gear de endgame. Cada item é verificado antes de ser listado. Pule o RNG e equipe-se para o endgame de ${l} com entrega rápida no jogo.`,
      },
    },
    "path-of-exile-2": {
      en: {
        meta: (l) =>
          `Buy Path of Exile 2 items for the ${l} league — curated unique weapons, armour, jewels and endgame equipment. Fast in-game delivery.`,
        body: (l) =>
          `Gear up for ${l} in Path of Exile 2 with our curated item selection — unique weapons, body armour, helmets, jewels and powerful endgame equipment. Every piece is hand-selected and verified before listing. Skip the farming RNG and jump straight into the best content ${l} has to offer.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre itens de Path of Exile 2 para a liga ${l} — armas únicas, armaduras, joias e equipamentos de endgame. Entrega rápida no jogo.`,
        body: (l) =>
          `Equipe-se para ${l} em Path of Exile 2 com nossa seleção curada de itens — armas únicas, armaduras, capacetes, joias e equipamentos poderosos de endgame. Cada peça é selecionada e verificada antes de ser listada. Pule o RNG do farming e entre direto no melhor conteúdo que ${l} tem a oferecer.`,
      },
    },
  },

  services: {
    "path-of-exile-1": {
      en: {
        meta: (l) =>
          `Buy Path of Exile 1 services for the ${l} league — power leveling, boss carries and atlas progression by veteran players.`,
        body: (l) =>
          `Accelerate your ${l} progression with Path of Trade services — power leveling from 1 to endgame, boss carries, atlas completion and pinnacle encounter boosts. All services are performed by veteran Path of Exile 1 players who know the ${l} meta inside out, with guaranteed completion and full discretion.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre serviços de Path of Exile 1 para a liga ${l} — power leveling, carries de chefes e progressão do atlas por veteranos.`,
        body: (l) =>
          `Acelere sua progressão em ${l} com os serviços do Path of Trade — power leveling do 1 ao endgame, carries de chefes, conclusão do atlas e boosts de encontros de pináculo. Todos os serviços são realizados por veteranos de Path of Exile 1 que dominam o meta de ${l}, com conclusão garantida e total discrição.`,
      },
    },
    "path-of-exile-2": {
      en: {
        meta: (l) =>
          `Buy Path of Exile 2 services for the ${l} league — power leveling, endgame boss carries and atlas progression by experienced players.`,
        body: (l) =>
          `Maximize your ${l} season in Path of Exile 2 with Path of Trade services — power leveling, endgame boss carries, pinnacle encounter runs and atlas progression. Our experienced team knows the ${l} meta, completing every service efficiently and discreetly so you can focus on enjoying the game.`,
      },
      "pt-br": {
        meta: (l) =>
          `Compre serviços de Path of Exile 2 para a liga ${l} — power leveling, carries de endgame e progressão do atlas por jogadores experientes.`,
        body: (l) =>
          `Maximize sua temporada de ${l} em Path of Exile 2 com os serviços do Path of Trade — power leveling, carries de chefes de endgame, runs de encontros de pináculo e progressão do atlas. Nossa equipe domina o meta de ${l}, concluindo cada serviço de forma eficiente e discreta para que você possa focar em aproveitar o jogo.`,
      },
    },
  },
};

// ─── generateStaticParams ─────────────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export async function generateStaticParams() {
  try {
    const leagues = await getAllActiveLeagues();
    const params: {
      locale: string;
      gameVersion: string;
      leagueSlug: string;
      slug: string;
    }[] = [];
    for (const locale of ["en", "pt-br"]) {
      for (const league of leagues) {
        for (const slug of [...CATEGORIES, ...KEY_PRODUCTS]) {
          params.push({
            locale,
            gameVersion: league.gameVersion,
            leagueSlug: nameToSlug(league.name),
            slug,
          });
        }
      }
    }
    return params;
  } catch {
    return [];
  }
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata(props: {
  params: Promise<{
    locale: string;
    gameVersion: string;
    leagueSlug: string;
    slug: string;
  }>;
}): Promise<Metadata> {
  const { locale, gameVersion, leagueSlug, slug } = await props.params;

  const isCategory = CATEGORIES.includes(slug as CategorySlug);
  const isKeyProduct = KEY_PRODUCTS.includes(slug as KeyProductSlug);
  if (!isCategory && !isKeyProduct) return { title: "Not Found" };

  const league = await getLeagueBySlugFromSupabase(leagueSlug, gameVersion);
  if (!league) return { title: "Not Found" };

  const isPt = locale === "pt-br";
  const loc = isPt ? "pt-br" : "en";
  const gv = gameVersion as "path-of-exile-1" | "path-of-exile-2";
  const gameShort = gv === "path-of-exile-2" ? "PoE 2" : "PoE 1";
  const path = `/games/${gameVersion}/league/${leagueSlug}/${slug}`;
  const enUrl = `${SITE_URL}${path}`;
  const ptUrl = `${SITE_URL}/pt-br${path}`;
  const canonicalUrl = locale === "en" ? enUrl : ptUrl;

  let title: string;
  let description: string;

  if (isCategory) {
    const cat = slug as CategorySlug;
    const catLabel = categoryLabels[cat][loc];
    title = isPt
      ? `Comprar ${catLabel} ${gameShort} — ${league.name} | Path of Trade`
      : `Buy ${gameShort} ${catLabel} for ${league.name} | Path of Trade`;
    description = categoryCopy[cat][gv][loc].meta(league.name);
  } else {
    const productName = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    title = isPt
      ? `Comprar ${productName} — ${league.name} | ${gameShort} | Path of Trade`
      : `Buy ${productName} — ${league.name} | ${gameShort} | Path of Trade`;
    description = productCopy[slug as KeyProductSlug][gv][loc].meta(league.name);
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: { en: enUrl, "pt-BR": ptUrl, "x-default": enUrl },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Path of Trade",
      images: isCategory
        ? [`${SITE_URL}/images/${gv === "path-of-exile-2" ? "path-of-exile2-card.webp" : "path-of-exile-card.webp"}`]
        : [`${SITE_URL}/images/products/${slug}.png`],
    },
    twitter: { card: "summary_large_image", title, description },
    keywords: generateKeywords({
      locale,
      gameVersion: gv,
      league: league.name,
      ...(isCategory ? {} : { productName: slug.replace(/-/g, " ") }),
    }),
  };
}

// ─── FAQ helpers ──────────────────────────────────────────────────────────────

function getCategoryFaq(
  cat: CategorySlug,
  gameShort: string,
  leagueTitle: string,
  isPt: boolean
): { q: string; a: string }[] {
  const label = categoryLabels[cat][isPt ? "pt-br" : "en"];
  if (isPt) {
    return [
      {
        q: `Como comprar ${label} para a liga ${leagueTitle}?`,
        a: `Navegue pelos itens listados acima, adicione ao carrinho e finalize o pedido. Nossa equipe entregará em até 30 minutos via troca no jogo.`,
      },
      {
        q: `Os preços de ${label} mudam com a liga?`,
        a: `Sim. Cada liga começa do zero, então os preços refletem a oferta e demanda da liga ${leagueTitle}. Atualizamos os preços diariamente.`,
      },
      {
        q: `É seguro comprar ${label} ${gameShort} no Path of Trade?`,
        a: `Sim. Todas as entregas são feitas pela janela de troca oficial do jogo. Nunca pedimos sua senha. Método seguro e testado em milhares de pedidos.`,
      },
    ];
  }
  return [
    {
      q: `How do I buy ${label} for the ${leagueTitle} league?`,
      a: `Browse the listings above, add items to your cart and complete checkout. Our team will deliver within 30 minutes via the in-game trade window.`,
    },
    {
      q: `Do ${label} prices change each league?`,
      a: `Yes. Each league starts fresh, so prices reflect the supply and demand of the ${leagueTitle} economy. We update prices daily to stay competitive.`,
    },
    {
      q: `Is buying ${gameShort} ${label} on Path of Trade safe?`,
      a: `Yes. All deliveries use the official in-game trade window. We never ask for your password. Our method is discreet and tested on thousands of orders.`,
    },
  ];
}

function getProductFaq(
  productName: string,
  leagueTitle: string,
  gameShort: string,
  isPt: boolean
): { q: string; a: string }[] {
  if (isPt) {
    return [
      {
        q: `Qual é o preço atual de ${productName} na liga ${leagueTitle}?`,
        a: `O preço está exibido acima e é atualizado regularmente com base na economia da liga ${leagueTitle}. Confira a listagem para o valor mais recente.`,
      },
      {
        q: `Quanto tempo demora para receber ${productName}?`,
        a: `A maioria das entregas é concluída em 5 a 30 minutos após a confirmação do pagamento, diretamente no jogo via troca padrão.`,
      },
      {
        q: `É seguro comprar ${productName} no Path of Trade?`,
        a: `Sim. Usamos apenas a janela de troca oficial do ${gameShort}. Nunca pedimos login ou senha. Transações discretas e seguras garantidas.`,
      },
    ];
  }
  return [
    {
      q: `What is the current price of ${productName} in ${leagueTitle}?`,
      a: `The price is shown in the listing above and is updated regularly based on the ${leagueTitle} economy. Check the card for the latest value.`,
    },
    {
      q: `How fast will I receive ${productName} after purchasing?`,
      a: `Most deliveries are completed within 5–30 minutes after payment confirmation, delivered directly via the in-game trade window.`,
    },
    {
      q: `Is it safe to buy ${productName} on Path of Trade?`,
      a: `Yes. We only use the official ${gameShort} trade window. We never ask for your login or password. Discreet and secure transactions on every order.`,
    },
  ];
}

// ─── FAQ component ────────────────────────────────────────────────────────────

function FaqSection({
  items,
  title,
}: {
  items: { q: string; a: string }[];
  title: string;
}) {
  return (
    <section className="mt-16 pt-10 border-t border-border/40">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="max-w-3xl space-y-0 divide-y divide-border/40">
        {items.map((item, i) => (
          <details key={i} className="group py-4">
            <summary className="flex cursor-pointer items-center justify-between list-none gap-4 font-medium text-foreground hover:text-primary transition-colors">
              {item.q}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-8">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LeagueSlugPage(props: {
  params: Promise<{
    locale: string;
    gameVersion: string;
    leagueSlug: string;
    slug: string;
  }>;
}) {
  const { locale, gameVersion, leagueSlug, slug } = await props.params;
  setRequestLocale(locale);

  const isCategory = CATEGORIES.includes(slug as CategorySlug);
  const isKeyProduct = KEY_PRODUCTS.includes(slug as KeyProductSlug);
  if (!isCategory && !isKeyProduct) notFound();

  const league = await getLeagueBySlugFromSupabase(leagueSlug, gameVersion);
  if (!league) notFound();

  const isPt = locale === "pt-br";
  const loc = isPt ? "pt-br" : "en";
  const gv = gameVersion as "path-of-exile-1" | "path-of-exile-2";
  const gameShort = gv === "path-of-exile-2" ? "PoE 2" : "PoE 1";
  const gameLabel = gv === "path-of-exile-2" ? "Path of Exile 2" : "Path of Exile 1";
  const path = `/games/${gameVersion}/league/${leagueSlug}/${slug}`;
  const leaguePath = `/games/${gameVersion}/league/${leagueSlug}`;
  const buyLabel = isPt ? "Comprar" : "Buy";
  const outOfStockLabel = isPt ? "Esgotado" : "Out of Stock";
  const faqTitle = isPt ? "Perguntas Frequentes" : "Frequently Asked Questions";

  // ── CATEGORY VIEW ──────────────────────────────────────────────────────────
  if (isCategory) {
    const cat = slug as CategorySlug;
    const catLabel = categoryLabels[cat][loc];

    const products = await getProductsWithParams({
      gameVersion,
      category: categoryDbValue[cat],
      league: league.name,
      orderByPrice: 'desc',
    });

    const h1 = isPt
      ? `Comprar ${catLabel} ${gameShort} — ${league.name}`
      : `Buy ${gameShort} ${catLabel} for ${league.name}`;

    const bodyText = categoryCopy[cat][gv][loc].body(league.name);

    const breadcrumbSchema = buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: gameLabel, url: `/games/${gameVersion}` },
      { name: league.name, url: leaguePath },
      { name: catLabel, url: path },
    ]);

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${gameShort} ${catLabel} — ${league.name}`,
      url: `${SITE_URL}${path}`,
      numberOfItems: products.length,
      itemListElement: products.slice(0, 20).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.name,
          image: p.imgUrl,
          url: `${SITE_URL}/products/${encodeProductName(p.name)}?gameVersion=${gv}&league=${encodeURIComponent(league.name)}`,
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "USD",
            availability:
              p.in_stock !== false
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        },
      })),
    };

    const faqItems = getCategoryFaq(cat, gameShort, league.name, isPt);
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    };

    return (
      <div className="container mx-auto py-6 md:py-10 px-4 max-w-7xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
            <li>
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
            </li>
            <li className="opacity-40">/</li>
            <li>
              <Link href={`/games/${gameVersion}`} className="hover:text-foreground transition-colors">
                {gameLabel}
              </Link>
            </li>
            <li className="opacity-40">/</li>
            <li>
              <Link href={leaguePath} className="hover:text-foreground transition-colors">
                {league.name}
              </Link>
            </li>
            <li className="opacity-40">/</li>
            <li className="text-foreground">{catLabel}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {gameShort}
            </span>
            <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
              {league.name}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{h1}</h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
            {bodyText}
          </p>
        </div>

        {/* Product count */}
        <p className="text-xs text-muted-foreground mb-5">
          {isPt
            ? `${products.length} produtos disponíveis`
            : `${products.length} products available`}
        </p>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {products.map((product) => (
              <CategoryItemCard
                key={product.id}
                product={product}
                locale={locale}
                buyLabel={buyLabel}
                outOfStockLabel={outOfStockLabel}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            {isPt
              ? "Nenhum produto disponível no momento."
              : "No products available at the moment."}
          </div>
        )}

        {/* Back link */}
        <div className="mt-10">
          <Link
            href={`/games/${gameVersion}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isPt ? `Voltar para ${gameLabel}` : `Back to ${gameLabel}`}
          </Link>
        </div>

        <FaqSection items={faqItems} title={faqTitle} />
      </div>
    );
  }

  // ── PRODUCT VIEW ───────────────────────────────────────────────────────────

  const productSlug = slug as KeyProductSlug;
  const productName = productSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  // Busca todos os produtos da liga e encontra o produto pelo slug do nome
  const allLeagueProducts = await getProductsWithParams({
    gameVersion,
    league: league.name,
    orderByPrice: 'desc',
  });

  const product = allLeagueProducts.find(
    (p: Product) => p.name.toLowerCase().replace(/\s+/g, "-") === productSlug
  );

  // Produtos relacionados da mesma categoria
  const relatedProducts = product
    ? allLeagueProducts
        .filter(
          (p: Product) =>
            p.category === product.category &&
            p.name.toLowerCase().replace(/\s+/g, "-") !== productSlug
        )
        .slice(0, 6)
    : [];

  const price = product?.price.toFixed(2);
  const bodyText = productCopy[productSlug][gv][loc].body(league.name, price);

  const h1 = isPt
    ? `Comprar ${productName} — ${league.name}`
    : `Buy ${productName} — ${league.name}`;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: gameLabel, url: `/games/${gameVersion}` },
    { name: league.name, url: leaguePath },
    { name: productName, url: path },
  ]);

  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: `${productName} — ${league.name}`,
        image: product.imgUrl,
        description: productCopy[productSlug][gv][loc].meta(league.name),
        brand: { "@type": "Brand", name: gameShort },
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}${path}`,
          priceCurrency: "USD",
          price: product.price,
          availability:
            product.in_stock !== false
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: "Path of Trade" },
        },
      }
    : null;

  const backCategorySlug = (product?.category?.toLowerCase() || "currency") as CategorySlug;
  const backCategoryLabel = categoryLabels[backCategorySlug]?.[loc] || backCategorySlug;

  const faqItems = getProductFaq(productName, league.name, gameShort, isPt);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <div className="container mx-auto py-6 md:py-10 px-4 max-w-7xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li className="opacity-40">/</li>
          <li>
            <Link href={`/games/${gameVersion}`} className="hover:text-foreground transition-colors">
              {gameLabel}
            </Link>
          </li>
          <li className="opacity-40">/</li>
          <li>
            <Link href={leaguePath} className="hover:text-foreground transition-colors">
              {league.name}
            </Link>
          </li>
          <li className="opacity-40">/</li>
          <li className="text-foreground">{productName}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {gameShort}
          </span>
          <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
            {league.name}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">{h1}</h1>
        <p className="text-muted-foreground max-w-2xl text-sm md:text-base leading-relaxed">
          {bodyText}
        </p>
      </div>

      {/* Product card or not-found notice */}
      {product ? (
        <div className="mb-12">
          <div className="max-w-sm bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-black/25 p-6 flex items-center justify-center">
              <Image
                src={product.imgUrl}
                alt={product.name}
                width={120}
                height={120}
                className="object-contain"
                quality={90}
              />
            </div>
            <div className="p-5">
              <h2 className="text-lg font-semibold mb-1">{product.name}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {league.name} — {gameShort}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  ${product.price.toFixed(2)}
                </span>
                <Link
                  href={`/products/${encodeProductName(product.name)}?gameVersion=${gv}&league=${encodeURIComponent(league.name)}`}
                  className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {buyLabel}
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground border border-border/40 rounded-xl mb-12">
          {isPt
            ? `${productName} não está disponível para a liga ${league.name} no momento.`
            : `${productName} is not currently available for the ${league.name} league.`}
        </div>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-5">
            {isPt ? "Produtos Relacionados" : "Related Products"}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {relatedProducts.map((p: Product) => (
              <CategoryItemCard
                key={p.id}
                product={p}
                locale={locale}
                buyLabel={buyLabel}
                outOfStockLabel={outOfStockLabel}
              />
            ))}
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="mt-4 mb-4">
        <Link
          href={`/games/${gameVersion}/league/${leagueSlug}/${backCategorySlug}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isPt
            ? `Voltar para ${backCategoryLabel} — ${league.name}`
            : `Back to ${backCategoryLabel} — ${league.name}`}
        </Link>
      </div>

      <FaqSection items={faqItems} title={faqTitle} />
    </div>
  );
}
