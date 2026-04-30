import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 300;

interface PriceItem {
  name: string;
  icon: string;
  ninjaChaos: number;
  exchangeChaos: number | null;
  difference: number | null;
  differencePercent: number | null;
  ninjaListingCount: number | null;
  exchangeListingCount: number | null;
  weSellThis: boolean;
  ourPriceUSD: number | null;
  ourPriceChaos: number | null;
}

const POE1_NINJA_BASE = 'https://poe.ninja/api/data';
const POE2_NINJA_BASE = 'https://poe.ninja/poe2/api/economy';

async function fetchNinjaPrices(game: 'poe1' | 'poe2', league: string): Promise<Map<string, { chaos: number; icon: string; listingCount: number | null }>> {
  const result = new Map<string, { chaos: number; icon: string; listingCount: number | null }>();
  
  try {
    let url: string;
    
    if (game === 'poe2') {
      url = `${POE2_NINJA_BASE}/currencyexchange/overview?leagueName=${encodeURIComponent(league)}&overviewName=Currency`;
    } else {
      url = `${POE1_NINJA_BASE}/currencyoverview?league=${encodeURIComponent(league)}&type=Currency`;
    }
    
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)' },
    });
    
    if (!res.ok) return result;
    
    const data = await res.json();
    
    if (game === 'poe2') {
      const itemMap = new Map<string, { name: string; icon: string }>();
      for (const item of data.items || []) {
        itemMap.set(item.id, { name: item.name, icon: item.icon || '' });
      }
      
      for (const line of data.lines || []) {
        const meta = itemMap.get(line.id);
        if (meta && line.primaryValue) {
          result.set(meta.name.toLowerCase(), {
            chaos: line.primaryValue,
            icon: meta.icon,
            listingCount: line.volumePrimaryValue ?? null,
          });
        }
      }
    } else {
      const iconMap = new Map<string, string>();
      for (const detail of data.currencyDetails || []) {
        iconMap.set(detail.name, detail.icon || '');
      }
      
      for (const line of data.lines || []) {
        const name = line.currencyTypeName;
        result.set(name.toLowerCase(), {
          chaos: line.chaosEquivalent ?? 0,
          icon: iconMap.get(name) || '',
          listingCount: null,
        });
      }
    }
  } catch (error) {
    console.error('[price-comparison] Ninja fetch error:', error);
  }
  
  return result;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const game = (searchParams.get('game') || 'poe1') as 'poe1' | 'poe2';
  const league = searchParams.get('league');
  
  if (!league) {
    return NextResponse.json({ error: 'League parameter required' }, { status: 400 });
  }
  
  try {
    const supabase = await createClient();
    
    const { data: leagueData } = await supabase
      .from('leagues')
      .select('name, poe_ninja_name')
      .eq('name', league)
      .single();
    
    const ninjaLeague = leagueData?.poe_ninja_name || league;
    
    const [ninjaData, divineProduct, products] = await Promise.all([
      fetchNinjaPrices(game, ninjaLeague),
      supabase
        .from('products')
        .select('price')
        .ilike('name', '%divine orb%')
        .eq('gameVersion', game === 'poe1' ? 'path-of-exile-1' : 'path-of-exile-2')
        .limit(1)
        .single(),
      supabase
        .from('products')
        .select('name, price, slug, in_stock, imgUrl')
        .eq('gameVersion', game === 'poe1' ? 'path-of-exile-1' : 'path-of-exile-2')
        .eq('is_listed', true),
    ]);
    
    const divinePriceUSD = divineProduct?.price ?? 0.15;
    
    const productMap = new Map<string, { price: number; slug: string; inStock: boolean; imgUrl?: string | null }>();
    for (const p of products || []) {
      productMap.set(p.name.toLowerCase(), { 
        price: p.price, 
        slug: p.slug, 
        inStock: p.in_stock ?? false,
        imgUrl: p.imgUrl
      });
    }
    
    const items: PriceItem[] = [];
    
    for (const [nameLower, ninjaInfo] of ninjaData) {
      const product = productMap.get(nameLower);
      
      const ninjaChaos = ninjaInfo.chaos;
      
      let ourPriceUSD: number | null = null;
      let ourPriceChaos: number | null = null;
      let differencePercent: number | null = null;
      
      if (product && product.price > 0) {
        ourPriceUSD = product.price;
        ourPriceChaos = (product.price / divinePriceUSD) * ninjaChaos;
        
        if (ninjaChaos > 0 && ourPriceChaos > 0) {
          const pricePerUnitChaos = ninjaChaos;
          differencePercent = ((ourPriceChaos - pricePerUnitChaos) / pricePerUnitChaos) * 100;
        }
      }
      
      // Normalize icon URL
      // Prioridade: 1. imgUrl local do Supabase, 2. ícone do ninja
      let icon = product?.imgUrl || ninjaInfo.icon || '';
      if (icon) {
        if (icon.startsWith('/')) {
          if (!icon.startsWith('/images/')) {
            icon = `https://web.poecdn.com${icon}`;
          }
        } else if (!icon.startsWith('http') && !icon.startsWith('//')) {
          icon = `https://web.poecdn.com/${icon}`;
        }
      }

      items.push({
        name: nameLower.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        icon,
        ninjaChaos,
        exchangeChaos: ourPriceChaos,
        difference: ourPriceChaos ? ourPriceChaos - ninjaChaos : null,
        differencePercent,
        ninjaListingCount: ninjaInfo.listingCount,
        exchangeListingCount: null,
        weSellThis: !!product,
        ourPriceUSD,
        ourPriceChaos,
      });
    }
    
    items.sort((a, b) => {
      const aWeSell = a.weSellThis ? 0 : 1;
      const bWeSell = b.weSellThis ? 0 : 1;
      if (aWeSell !== bWeSell) return aWeSell - bWeSell;
      
      const aPct = Math.abs(a.differencePercent ?? 0);
      const bPct = Math.abs(b.differencePercent ?? 0);
      return bPct - aPct;
    });
    
    return NextResponse.json({
      items,
      meta: {
        game,
        league,
        ninjaLeague,
        divinePriceUSD,
        fetchedAt: new Date().toISOString(),
        ninjaItems: ninjaData.size,
        productsWeSell: items.filter(i => i.weSellThis).length,
      },
    });
    
  } catch (error) {
    console.error('[price-comparison] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 });
  }
}
