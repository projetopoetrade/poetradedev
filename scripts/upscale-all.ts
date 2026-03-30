import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function upscaleAllImages() {
    console.log("==================================================");
    console.log("✨ Iniciando BATCH Upscale de Todas as Imagens");
    console.log("==================================================");

    const imagesDir = path.resolve(process.cwd(), 'public', 'images', 'products');

    if (!fs.existsSync(imagesDir)) {
        console.error(`❌ Diretório de imagens não encontrado: ${imagesDir}`);
        return;
    }

    // Path to the actual downloaded binary
    const binPath = path.resolve(process.cwd(), 'node_modules', 'upscayl-node', 'dist', 'upscaler', 'sub-classes', 'driver', 'command-upscayl', 'resources', 'win', 'bin', 'upscayl-bin.exe');
    // Path to the embedded models
    const modelsPath = path.resolve(process.cwd(), 'node_modules', 'upscayl-node', 'dist', 'upscaler', 'sub-classes', 'model-manager', 'models');

    // Ler todos os arquivos da pasta
    const allFiles = fs.readdirSync(imagesDir);

    // Filtrar apenas imagens que queremos processar e ignorar temporários ou já concluídos
    const imageFiles = allFiles.filter(file => {
        return (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp'))
            && !file.endsWith('-hd.png')
            && !file.endsWith('-temp.png');
    });

    console.log(`> Encontradas ${imageFiles.length} imagens para processar.`);

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const inputPath = path.resolve(imagesDir, file);

        // Vamos gerar com um sufixo temporário na mesma pasta
        const parsedPath = path.parse(file);
        const tempOutputFile = `${parsedPath.name}-temp${parsedPath.ext}`;
        const tempOutputPath = path.resolve(imagesDir, tempOutputFile);

        console.log(`[${i + 1}/${imageFiles.length}] Processando: ${file}...`);

        const args = [
            '-i', inputPath,
            '-o', tempOutputPath,
            '-m', modelsPath,
            '-n', 'realesrgan-x4plus', // Model included in upscayl-node
            '-s', '4', // 4x scale
            '-f', 'webp' // Forçar saída WEBP para não perdermos a otimização
        ];

        try {
            // Executa a IA na imagem
            await execFileAsync(binPath, args);

            // Se funcionou, substituímos o arquivo original pelo temporário HD
            if (fs.existsSync(tempOutputPath)) {
                // Remove the old low-res original
                fs.unlinkSync(inputPath);
                // Renomeia o HD temp para ser o arquivo principal
                fs.renameSync(tempOutputPath, inputPath);
                console.log(`  ✅ Concluído e renomeado!`);
            } else {
                console.log(`  ⚠️ Aviso: Arquivo temporário não foi gerado.`);
            }

        } catch (error: any) {
            console.error(`  ❌ Erro processando ${file}:`);
            console.error(error.message || error);
        }
    }

    console.log("==================================================");
    console.log(`🎉 Processamento BATCH Finalizado!`);
    console.log("==================================================");
}

upscaleAllImages();
