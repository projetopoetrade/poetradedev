import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

async function run() {
    console.log(">> Atualizando banco de dados de .png para .webp...");
    const { data: products, error } = await supabase.from('products').select('id, name, imgUrl');

    if (error || !products) {
        console.error("Erro ao buscar produtos:", error);
        return;
    }

    let updatedCount = 0;
    for (const p of products) {
        if (p.imgUrl && p.imgUrl.endsWith('.png')) {
            const newUrl = p.imgUrl.replace(/\.png$/, '.webp');
            const { error: updateError } = await supabase
                .from('products')
                .update({ imgUrl: newUrl })
                .eq('id', p.id);
            
            if (updateError) {
                console.error(`❌ Erro ao atualizar DB para ${p.name}:`, updateError.message);
            } else {
                updatedCount++;
            }
        }
    }
    console.log(`✅ Banco de dados atualizado! ${updatedCount} produtos modificados.`);
}

run();
