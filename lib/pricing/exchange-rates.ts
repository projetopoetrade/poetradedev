import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Taxas de câmbio a partir do dólar — fonte única para o site inteiro.
 *
 * Existe para que o servidor possa calcular o valor cobrado sem depender do que
 * o cliente manda. O checkout do Pix recebia `amount` pronto do browser e cobrava
 * exatamente aquilo; quem forjasse a requisição escolhia o próprio preço.
 *
 * `/api/exchange-rates` (consumido pelo front) e as rotas de checkout chamam esta
 * MESMA função, então o preço exibido e o preço cobrado saem do mesmo número.
 * Não troque a fonte em um lugar só — a garantia toda vem daí.
 *
 * A cadeia tem quatro degraus, do melhor para o pior:
 *
 *   1. open.er-api.com   — API dedicada, atualização diária, sem chave
 *   2. jsDelivr          — servido por CDN; sobrevive a queda de API
 *   3. `exchange_rate_cache` — último conjunto que funcionou, no nosso banco
 *   4. FALLBACK_RATES    — constante, só se tudo acima falhar
 *
 * A Frankfurter era a fonte anterior e foi removida: `api.frankfurter.app` hoje
 * responde só com um 301 para `api.frankfurter.dev`, que estava retornando 522
 * em 28/07/2026. O site seguia de pé apenas servindo cache velho.
 */

const SOURCES = [
  {
    name: "open-er-api",
    url: "https://open.er-api.com/v6/latest/USD",
    parse: (d: any) => d?.rates,
  },
  {
    name: "jsdelivr",
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    // Esta fonte usa códigos minúsculos e aninha sob a moeda base.
    parse: (d: any) =>
      d?.usd && { EUR: d.usd.eur, GBP: d.usd.gbp, BRL: d.usd.brl },
  },
];

const CACHE_SECONDS = 86400;
const CACHE_ROW_ID = "usd";

// Evita ida ao banco a cada requisição: o upsert só interessa quando a taxa muda,
// e ela muda uma vez por dia. Reinicia a cada cold start, o que no pior caso
// custa uma escrita a mais.
const PERSIST_INTERVAL_MS = 6 * 60 * 60 * 1000;
let lastPersistedAt = 0;

export type ExchangeRates = { USD: number; EUR: number; GBP: number; BRL: number };

/**
 * Último recurso. Mantido próximo do mercado de propósito — este número vira o
 * preço cobrado se tudo o mais falhar. Conferido em 28/07/2026.
 */
export const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.8788,
  GBP: 0.7519,
  BRL: 5.0919,
};

export type RatesResult = {
  rates: ExchangeRates;
  source: string;
  /** Quando a taxa foi obtida na origem; ausente na constante. */
  fetchedAt?: string;
};

function isValid(rates: any): rates is Omit<ExchangeRates, "USD"> {
  return (
    rates &&
    ["EUR", "GBP", "BRL"].every(
      (k) => typeof rates[k] === "number" && Number.isFinite(rates[k]) && rates[k] > 0,
    )
  );
}

async function fetchFromSource(source: (typeof SOURCES)[number]): Promise<ExchangeRates | null> {
  try {
    const response = await fetch(source.url, { next: { revalidate: CACHE_SECONDS } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const parsed = source.parse(await response.json());
    if (!isValid(parsed)) throw new Error("payload sem EUR/GBP/BRL válidos");
    return { USD: 1, EUR: parsed.EUR, GBP: parsed.GBP, BRL: parsed.BRL };
  } catch (error) {
    console.error(`[ExchangeRates] ${source.name} falhou:`, error);
    return null;
  }
}

async function persist(rates: ExchangeRates, source: string): Promise<void> {
  if (Date.now() - lastPersistedAt < PERSIST_INTERVAL_MS) return;
  try {
    const admin = createAdminClient();
    await admin
      .from("exchange_rate_cache")
      .upsert({ id: CACHE_ROW_ID, rates, source, fetched_at: new Date().toISOString() });
    lastPersistedAt = Date.now();
  } catch (error) {
    // Falha ao persistir não pode derrubar um checkout — a taxa em mãos é boa.
    console.error("[ExchangeRates] Falha ao gravar cache:", error);
  }
}

async function readPersisted(): Promise<RatesResult | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("exchange_rate_cache")
      .select("rates, source, fetched_at")
      .eq("id", CACHE_ROW_ID)
      .maybeSingle();
    if (!data || !isValid(data.rates)) return null;
    return {
      rates: { USD: 1, ...(data.rates as Omit<ExchangeRates, "USD">) },
      source: `cache(${data.source})`,
      fetchedAt: data.fetched_at,
    };
  } catch (error) {
    console.error("[ExchangeRates] Falha ao ler cache:", error);
    return null;
  }
}

export async function getExchangeRates(): Promise<RatesResult> {
  for (const source of SOURCES) {
    const rates = await fetchFromSource(source);
    if (rates) {
      await persist(rates, source.name);
      return { rates, source: source.name, fetchedAt: new Date().toISOString() };
    }
  }

  const persisted = await readPersisted();
  if (persisted) {
    console.warn("[ExchangeRates] Todas as fontes falharam; usando cache do banco.");
    return persisted;
  }

  console.error("[ExchangeRates] Sem fonte e sem cache; usando constante do código.");
  return { rates: FALLBACK_RATES, source: "fallback" };
}

/**
 * Converte um total em USD para centavos da moeda alvo.
 *
 * Centavos porque é a unidade que os gateways cobram (AbacatePay e Stripe), e
 * arredondar só no fim evita o erro de somar centavos item a item.
 */
export function toMinorUnits(amountUsd: number, rate: number): number {
  return Math.round(amountUsd * rate * 100);
}
