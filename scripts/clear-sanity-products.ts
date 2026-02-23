import { createClient as createSanityClient } from '@sanity/client';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente locais do .env ou .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// NOTA: Para deletar documentos no Sanity, você precisa do token de gravação (SANITY_API_KEY)
const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const sanityDataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const sanityWriteToken = process.env.SANITY_API_KEY;

if (!sanityWriteToken) {
    console.error("⚠️ ERRO: A variável SANITY_API_KEY não foi encontrada no .env.local");
    process.exit(1);
}

const sanity = createSanityClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: '2023-05-03',
    token: sanityWriteToken,
    useCdn: false, // CDN deve ser false para escrita/deleção
});

async function clearProducts() {
    console.log("========================================");
    console.log("🧹 Iniciando Limpeza de Produtos no Sanity");
    console.log("========================================");

    try {
        const query = `*[_type == "product"]{_id}`;
        console.log("Buscando todos os produtos...");
        const products = await sanity.fetch(query);

        if (!products || products.length === 0) {
            console.log("Nenhum produto encontrado. O banco já está limpo!");
            return;
        }

        console.log(`Encontrados ${products.length} produtos. Apagando em lotes...`);

        // Deletar em lotes (transactions) é melhor para não estourar o limite da API
        const batchSize = 50;
        let deletedCount = 0;

        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            const transaction = sanity.transaction();

            batch.forEach((doc: any) => {
                transaction.delete(doc._id);
            });

            await transaction.commit();
            deletedCount += batch.length;
            console.log(`>>> Deletados ${deletedCount}/${products.length}...`);

            // Pausa rápida entre os lotes de 500ms
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log("✅ Limpeza concluída com sucesso!");

    } catch (error: any) {
        console.error("❌ Erro fatal ao limpar produtos:", error.message);
    }
}

clearProducts();
