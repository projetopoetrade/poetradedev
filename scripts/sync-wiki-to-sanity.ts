import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createSanityClient } from '@sanity/client';
import { marked } from 'marked';
import { htmlToBlocks } from '@sanity/block-tools';
import { JSDOM } from 'jsdom';
import Schema from '@sanity/schema';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente locais do .env ou .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// 1. Configurar Clientes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

// NOTA: Para criar documentos no Sanity, você precisa de um token de gravação (WRITE TOKEN), 
// configurado no seu painel do Sanity e adicionado como SANITY_API_WRITE_TOKEN.
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const sanityWriteToken = process.env.SANITY_API_KEY;

if (!sanityWriteToken) {
    console.warn("⚠️ AVISO: A variável SANITY_API_KEY não foi encontrada.");
    console.warn("O script não conseguirá criar documentos no Sanity sem permissão de escrita.");
}

const sanity = createSanityClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: '2023-05-03',
    token: sanityWriteToken,
    useCdn: false, // CDN deve ser false para escrita
});

// 2. Configurar o Conversor de Blocos (HTML -> Portable Text)
// Para que o @sanity/block-tools funcione em NodeJS, passamos a implementação do DOM do JSDOM.
const { window } = new JSDOM('');
const blockContentType = Schema.compile({
    name: 'default',
    types: [
        {
            type: 'object',
            name: 'productBody',
            fields: [
                {
                    name: 'body',
                    type: 'array',
                    of: [{ type: 'block' }, { type: 'image' }],
                },
            ],
        },
    ],
}).get('productBody').fields.find((field: any) => field.name === 'body').type;

async function markdownToPortableText(markdownContent: string) {
    // 1. Markdown para HTML
    const html = await marked.parse(markdownContent);
    // 2. HTML para Blocos usando a instância JSDOM
    const blocks = htmlToBlocks(html, blockContentType, {
        parseHtml: (htmlStr) => new window.DOMParser().parseFromString(htmlStr, 'text/html'),
    });
    return blocks;
}

// 3. Função Principal
async function syncDatabaseToCMS() {
    console.log("========================================");
    console.log("Iniciando Sincronização: Wiki -> Sanity");
    console.log("========================================");

    try {
        const targetLeague = process.argv[2]; // ex: npx ts-node scripts/sync-wiki-to-sanity.ts "Keepers"

        // A. Buscar todos os produtos do Supabase (únicos pelo nome)
        if (targetLeague) {
            console.log(`📦 Buscando produtos no Supabase (Filtrando pela liga: ${targetLeague})...`);
        } else {
            console.log("📦 Buscando TODOS os produtos no Supabase...");
        }

        let query = supabase
            .from('products')
            .select('name, slug, category, gameVersion, league, difficulty');

        if (targetLeague) {
            query = query.eq('league', targetLeague);
        }

        const { data: supabaseProducts, error: supabaseError } = await query;

        if (supabaseError) throw supabaseError;
        if (!supabaseProducts || supabaseProducts.length === 0) {
            console.log("Nenhum produto encontrado no Supabase para esta liga.");
            return;
        }

        // B. Agrupar produtos únicos pelo nome para evitar duplicações/variantes
        const uniqueProducts = supabaseProducts.reduce((acc, current) => {
            if (!acc[current.name]) {
                acc[current.name] = current;
            }
            return acc;
        }, {} as Record<string, any>);
        const productsToSync = Object.values(uniqueProducts);
        console.log(`📦 Encontrados ${productsToSync.length} produtos únicos no Supabase.`);

        // C. Buscar produtos existentes no Sanity
        console.log("🛠️ Buscando páginas existentes no Sanity...");
        const sanityProducts = await sanity.fetch(`*[_type == "product"]{ "slug": slug.current }`);
        // Criação de um Set(conjunto de slugs) para pesquisa rápida
        const existingSlugs = new Set(sanityProducts.map((p: any) => p.slug));

        // D. Identificar o que falta
        const missingProducts = productsToSync.filter(p => !existingSlugs.has(p.slug));
        console.log(`🔍 Itens faltando no Sanity: ${missingProducts.length}`);

        // E. Sincronizar (Geração + Criação)
        for (const item of missingProducts) {
            console.log(`\n----------------------------------------`);
            console.log(`⏳ Processando: ${item.name} (${item.slug})`);

            try {
                // E1. Chamar a API de Conteúdo (Baseada LLM+Crawler)
                console.log(`   > Solicitando conteúdo API Crawler...`);

                // Pedindo PT-BR
                const resPt = await fetch('http://localhost:8000/api/generate/item-seo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item_name: item.name, language: 'pt-br' })
                });

                if (!resPt.ok) {
                    console.error(`   ❌ Falha ao obter dados para PT-BR. Status: ${resPt.status}`);
                    continue; // Pula este item se a API Wiki falhar
                }
                const dataPt = await resPt.json();

                // Wait 5 seconds to avoid Gemini API limits
                console.log(`   ⏳ Aguardando 5s antes de pedir a versão EN...`);
                await new Promise(resolve => setTimeout(resolve, 5000));

                // Pedindo EN
                const resEn = await fetch('http://localhost:8000/api/generate/item-seo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ item_name: item.name, language: 'en' })
                });
                const dataEn = resEn.ok ? await resEn.json() : dataPt; // Fallback para pt-br caso falhe

                // E2. Converter Markdown para Portable Text
                console.log(`   > Convertendo Markdown para Sanity Blocks...`);
                const ptBlocks = await markdownToPortableText(dataPt.body_content_markdown || '');
                const enBlocks = await markdownToPortableText(dataEn.body_content_markdown || '');

                // E3. Montar Documento Sanity
                const sanityDoc = {
                    _type: 'product',
                    name: item.name,
                    slug: { _type: 'slug', current: item.slug },
                    category: item.category || 'Currency',
                    gameVersion: item.gameVersion || 'path-of-exile-1',
                    league: item.league || 'Standard',
                    difficulty: item.difficulty || 'softcore',
                    // SEO
                    seoTitle: {
                        pt_br: dataPt.seo_title || `${item.name} | Path of Trade`,
                        en: dataEn.seo_title || `${item.name} | Path of Trade`,
                    },
                    metaDescription: {
                        pt_br: dataPt.meta_description || `Comprar ${item.name}`,
                        en: dataEn.meta_description || `Buy ${item.name}`,
                    },
                    // Textos Rich Text
                    body: {
                        en: enBlocks,
                        pt_br: ptBlocks
                    }
                };

                // E4. Criar Documento
                console.log(`   > Criando documento no Sanity...`);
                if (sanityWriteToken) {
                    const createdItem = await sanity.create(sanityDoc);
                    console.log(`   ✅ Documento '${createdItem.name}' salvo com sucesso (ID: ${createdItem._id})`);
                } else {
                    console.log("   ⚠️ Criação ignorada (Dry-Run). Sem SANITY_API_KEY.");
                }

                // E5. Rate Limiting Pause between items
                console.log(`   ⏳ Pausa de 10 segundos para respeitar os limites de requisição da IA...`);
                await new Promise(resolve => setTimeout(resolve, 10000));

            } catch (err) {
                console.error(`   ❌ Erro durante o processamento de ${item.name}:`);
                console.error(err);
            }
        }

        console.log("\n✅ Sincronização finalizada!");

    } catch (error) {
        console.error("❌ Ocorreu um erro fatal durante a sincronização:");
        console.error(error);
    }
}

syncDatabaseToCMS();
