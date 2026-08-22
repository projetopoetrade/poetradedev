import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { revalidateSite } from './lib/revalidate-site.mjs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

const POE_NINJA_BASE = 'https://poe.ninja/api/data';

// Helper to download an image
function downloadImage(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => reject(err));
        });
    });
}

async function runImageDownloader() {
    console.log("==================================================");
    console.log("🖼️  Iniciando Download Automático de Imagens...");
    console.log("==================================================");

    // Ensure the output directory exists
    const imgDir = path.resolve(process.cwd(), 'public', 'images', 'products');
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
        console.log(`📂 Criado diretório: ${imgDir}`);
    }

    try {
        // 1. Get all unique product names/slugs from Supabase
        console.log(">> Buscando produtos no banco de dados...");
        const { data: products, error: dbError } = await supabase
            .from('products')
            .select('id, name, slug, imgUrl');

        if (dbError || !products) {
            console.error("Erro ao buscar produtos:", dbError);
            return;
        }

        console.log(`Foram encontrados ${products.length} produtos no banco.`);

        // 2. Fetch Currency and Fragment details from PoE Ninja to find icons
        console.log(">> Buscando detalhes de ícones na PoE Ninja...");
        const ninjaData = new Map<string, string>(); // name -> iconUrl

        const endpoints = [
            `${POE_NINJA_BASE}/currencyoverview?league=Standard&type=Currency`,
            `${POE_NINJA_BASE}/currencyoverview?league=Standard&type=Fragment`
        ];

        for (const endpoint of endpoints) {
            try {
                const res = await fetch(endpoint, { headers: { 'User-Agent': 'PathOfTrade/1.0' } });
                if (!res.ok) continue;
                const data = await res.json();

                // Extrair da lista de detalhes da moeda
                if (data.currencyDetails) {
                    for (const item of data.currencyDetails) {
                        if (item.name && item.icon) {
                            ninjaData.set(item.name.toLowerCase(), item.icon);
                        }
                    }
                }
            } catch (err) {
                console.error(`Falha ao carregar endpoint Ninja: ${endpoint}`);
            }
        }

        console.log(`Encontrados ${ninjaData.size} ícones mapeados na API.`);

        // 3. Download and update Supabase
        let updatedCount = 0;
        let skippedCount = 0;

        for (const product of products) {
            // Check if we need to update
            // We'll update if it's external, placeholder, or just to standardize

            const ninjaIconUrl = ninjaData.get(product.name.toLowerCase());

            if (!ninjaIconUrl) {
                console.log(`   [Pular] Sem ícone Ninja para: ${product.name}`);
                skippedCount++;
                continue;
            }

            const fileName = `${product.slug}.webp`;
            const destPath = path.join(imgDir, fileName);
            const dbImgUrl = `/images/products/${fileName}`;

            // Se o produto já tem essa URL do nosso servidor, e o arquivo existe, pula (para não fuzilar de requests à toa)
            if (product.imgUrl === dbImgUrl && fs.existsSync(destPath)) {
                // console.log(`   [Pular] Já possui arquivo local atualizado: ${product.name}`);
                skippedCount++;
                continue;
            }

            console.log(`   > Baixando imagem para: ${product.name}...`);
            try {
                // Remove querystrings if any in the CDN url before downloading
                const cleanIconUrl = ninjaIconUrl;

                const tempPath = destPath.replace('.webp', '.tmp.png');
                await downloadImage(cleanIconUrl, tempPath);

                // Converter para WebP usando sharp
                const sharp = require('sharp');
                await sharp(tempPath).webp({ quality: 80, effort: 6 }).toFile(destPath);
                fs.unlinkSync(tempPath);

                // Update Supabase with the new local URL path
                const { error: updateError } = await supabase
                    .from('products')
                    .update({ imgUrl: dbImgUrl })
                    .eq('id', product.id);

                if (updateError) {
                    console.error(`     ❌ Erro ao atualizar DB: ${updateError.message}`);
                } else {
                    console.log(`     ✅ Salvo em ${dbImgUrl}`);
                    updatedCount++;
                }

                // Pause to not get banned by cloudflare/CDN
                await new Promise(res => setTimeout(res, 500));

            } catch (err: any) {
                console.error(`     ❌ Erro ao baixar imagem:`, err.message);
            }
        }

        console.log("==================================================");
        // `imgUrl` aparece na página de produto e na listagem: sem invalidar,
        // o ícone novo só entraria quando o TTL de 6 h vencesse.
        if (updatedCount > 0) await revalidateSite(["db-products"]);

        console.log(`🏁 Concluído! Atualizados: ${updatedCount} | Ignorados: ${skippedCount}`);
        console.log("==================================================");

    } catch (error) {
        console.error("❌ Ocorreu um erro no processo geral:", error);
    }
}

runImageDownloader();
