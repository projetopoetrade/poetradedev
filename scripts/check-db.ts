import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Fetching some currency_price_history...");
    const { data: history } = await supabase.from('currency_price_history').select('*').limit(5);
    console.log("currency_price_history:", history);

    console.log("Fetching a product...");
    const { data: product } = await supabase.from('products').select('*').limit(1);
    console.log("Product fields:", Object.keys(product?.[0] || {}));
}

check();
