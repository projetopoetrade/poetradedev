const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Caminho para a pasta onde o seu script PowerShell salvou as imagens
const imagesRoot = path.join(__dirname, '..', 'public', 'images', 'products');

async function processDirectory(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                // Se for uma pasta (gem, jewel, etc), entra nela recursivamente
                await processDirectory(fullPath);
            } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.png') {
                // Se for um arquivo PNG, vamos converter
                const outputPath = fullPath.replace(/\.png$/i, '.webp');

                try {
                    await sharp(fullPath)
                        .webp({ quality: 80, effort: 6 }) // quality 80 é um ótimo balanço de peso/qualidade
                        .toFile(outputPath);

                    console.log(`[OK] Convertido: ${entry.name} -> ${path.basename(outputPath)}`);

                    // Apaga o arquivo .png original após converter com sucesso
                    await fs.unlink(fullPath);
                } catch (err) {
                    console.error(`[ERRO] Falha ao converter ${entry.name}:`, err.message);
                }
            }
        }
    } catch (err) {
        console.error(`Erro ao ler o diretório ${dir}:`, err);
    }
}

console.log('Iniciando conversão para WebP...');
processDirectory(imagesRoot).then(() => {
    console.log('Conversão finalizada com sucesso!');
});