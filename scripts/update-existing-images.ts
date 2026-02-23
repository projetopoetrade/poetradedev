import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

async function formatAllProductsImgUrl() {
    console.log("==================================================");
    console.log("🚀 Atualizando o Caminho das Imagens no Supabase");
    console.log("==================================================");

    try {
        console.log(">> Buscando produtos...");
        const { data: products, error: dbError } = await supabase
            .from('products')
            .select('id, name, slug, imgUrl');

        if (dbError || !products) {
            console.error("❌ Erro ao buscar produtos:", dbError);
            return;
        }

        console.log(`Foram encontrados ${products.length} produtos.`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const product of products) {
            const expectedUrl = `/images/products/${product.slug}.png`;

            if (product.imgUrl === expectedUrl) {
                skippedCount++;
                continue;
            }

            console.log(`   > Redirecionando [${product.name}] para ${expectedUrl}...`);
            const { error: updateError } = await supabase
                .from('products')
                .update({ imgUrl: expectedUrl })
                .eq('id', product.id);

            if (updateError) {
                console.error(`     ❌ Erro no update: ${updateError.message}`);
            } else {
                console.log(`     ✅ Sucesso`);
                updatedCount++;
            }
        }

        console.log("==================================================");
        console.log(`🏁 Atualizados: ${updatedCount} | Já estavam corretos: ${skippedCount}`);
        console.log("==================================================");

    } catch (error) {
        console.error("❌ Ocorreu um erro geral:", error);
    }
}

formatAllProductsImgUrl();
