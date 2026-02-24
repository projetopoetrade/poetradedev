import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const revalidate = 300;

interface NinjaCurrency {
  currencyTypeName: string;
  chaosEquivalent: number;
  receiveSparkLine?: { data: number[]; totalChange: number } | null;
}

interface ExchangeItem {
  id: string;
  name: string;
  icon?: string;
  poeTradeId?: string;
}

interface ExchangeLine {
  id: string;
  equivalent?: number;
  listingCount?: number;
}

interface PriceItem {
  name: string;
  icon: string;
  ninjaChaos: number;
  exchangeChaos: number | null;
  difference: number | null;
  differencePercent: number | null;
  ninjaListingCount: number | null;
  exchangeListingCount: number | null;
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

async function fetchExchangePrices(game: 'poe1' | 'poe2', league: string): Promise<Map<string, { chaos: number; listingCount: number | null }>> {
  const result = new Map<string, { chaos: number; listingCount: number | null }>();
  
  try {
    const leagueParam = encodeURIComponent(league);
    let url: string;
    
    if (game === 'poe2') {
      url = `https://www.pathofexile.com/api/poe2/trade2/data/compactcurrencyitems?league=${leagueParam}`;
    } else {
      url = `https://www.pathofexile.com/api/trade/data/compactcurrencyitems?league=${leagueParam}`;
    }
    
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)' },
    });
    
    if (!res.ok) return result;
    
    const data = await res.json();
    
    const itemIdMap = new Map<string, string>();
    for (const item of data.result || []) {
      const name = item.name || item.text;
      if (name && item.id) {
        itemIdMap.set(name.toLowerCase(), item.id);
      }
    }
    
    const chaosId = itemIdMap.get('chaos orb') || itemIdMap.get('chaos');
    
    if (!chaosId) return result;
    
    let exchangeUrl: string;
    if (game === 'poe2') {
      exchangeUrl = `https://www.pathofexile.com/api/poe2/trade2/exchange/${leagueParam}`;
    } else {
      exchangeUrl = `https://www.pathofexile.com/api/trade/exchange/${leagueParam}`;
    }
    
    const exchangeRequests: { want: string[]; have: string[] }[] = [];
    const itemsToQuery = Array.from(itemIdMap.entries()).filter(([name]) => name !== 'chaos orb' && name !== 'chaos');
    
    for (const [name, id] of itemsToQuery) {
      exchangeRequests.push({
        want: [id],
        have: [chaosId],
      });
    }
    
    const BATCH_SIZE = 10;
    for (let i = 0; i < exchangeRequests.length; i += BATCH_SIZE) {
      const batch = exchangeRequests.slice(i, i + BATCH_SIZE);
      
      const requestBody = {
        queries: batch,
      };
      
      try {
        const exchangeRes = await fetch(exchangeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'PathOfTrade/1.0 (pathoftrade.net)',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!exchangeRes.ok) continue;
        
        const exchangeData = await exchangeRes.json();
        
        for (let j = 0; j < batch.length; j++) {
          const itemName = itemsToQuery[i + j]?.[0];
          const queryResult = exchangeData[j];
          
          if (itemName && queryResult?.result?.length > 0) {
            const listings = queryResult.result.slice(0, 10);
            let totalChaos = 0;
            let count = 0;
            
            for (const listing of listings) {
              if (listing.offer?.amount && listing.offer?.exchange_amount) {
                const chaosPerItem = listing.offer.exchange_amount / listing.offer.amount;
                totalChaos += chaosPerItem;
                count++;
              }
            }
            
            if (count > 0) {
              result.set(itemName, {
                chaos: totalChaos / count,
                listingCount: queryResult.result.length,
              });
            }
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (batchError) {
        console.error('[price-comparison] Exchange batch error:', batchError);
      }
    }
    
  } catch (error) {
    console.error('[price-comparison] Exchange fetch error:', error);
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
    
    const [ninjaData, exchangeData] = await Promise.all([
      fetchNinjaPrices(game, ninjaLeague),
      fetchExchangePrices(game, league),
    ]);
    
    const items: PriceItem[] = [];
    
    for (const [nameLower, ninjaInfo] of ninjaData) {
      const exchangeInfo = exchangeData.get(nameLower);
      
      const ninjaChaos = ninjaInfo.chaos;
      const exchangeChaos = exchangeInfo?.chaos ?? null;
      
      let difference: number | null = null;
      let differencePercent: number | null = null;
      
      if (exchangeChaos !== null && exchangeChaos > 0) {
        difference = ninjaChaos - exchangeChaos;
        differencePercent = (difference / exchangeChaos) * 100;
      }
      
      items.push({
        name: nameLower.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        icon: ninjaInfo.icon,
        ninjaChaos,
        exchangeChaos,
        difference,
        differencePercent,
        ninjaListingCount: ninjaInfo.listingCount,
        exchangeListingCount: exchangeInfo?.listingCount ?? null,
      });
    }
    
    items.sort((a, b) => {
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
        fetchedAt: new Date().toISOString(),
        ninjaItems: ninjaData.size,
        exchangeItems: exchangeData.size,
      },
    });
    
  } catch (error) {
    console.error('[price-comparison] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch comparison data' }, { status: 500 });
  }
}
