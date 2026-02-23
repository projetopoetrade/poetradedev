import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function testUpscale() {
    console.log("==================================================");
    console.log("✨ Iniciando Teste Direto do Binário Upscayl (IA)");
    console.log("==================================================");

    const inputPath = path.resolve(process.cwd(), 'public', 'images', 'products', 'mirror-of-kalandra-path-of-exile-1-keepers-of-the-flame-softcore.png');
    const outputPath = path.resolve(process.cwd(), 'public', 'images', 'products', 'mirror-of-kalandra-hd.png');

    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Arquivo original não encontrado: ${inputPath}`);
        return;
    }

    // Path to the actual downloaded binary inside the node module
    const binPath = path.resolve(process.cwd(), 'node_modules', 'upscayl-node', 'dist', 'upscaler', 'sub-classes', 'driver', 'command-upscayl', 'resources', 'win', 'bin', 'upscayl-bin.exe');
    // Path to the folder containing the *.param and *.bin files
    const modelsPath = path.resolve(process.cwd(), 'node_modules', 'upscayl-node', 'dist', 'upscaler', 'sub-classes', 'model-manager', 'models');

    console.log(`> Imagem original: ${inputPath}`);
    console.log(`> Executando binário: ${binPath}`);
    console.log(`> Usando modelos: ${modelsPath}`);
    console.log(`> Processando modelo IA na sua GPU...`);

    const args = [
        '-i', inputPath,
        '-o', outputPath,
        '-m', modelsPath,
        '-n', 'realesrgan-x4plus', // Model included in upscayl-node
        '-s', '4' // 4x scale
    ];

    try {
        const { stdout, stderr } = await execFileAsync(binPath, args);

        console.log("==================================================");
        console.log(`✅ Upscale concluído com sucesso!`);
        if (stdout) console.log(stdout.trim());
        if (stderr) console.log(stderr.trim());
        console.log(`> Imagem HD salva em: ${outputPath}`);
        console.log("==================================================");
    } catch (error: any) {
        console.error("❌ Erro durante a execução do binário:");
        console.error(error.message || error);
    }
}

testUpscale();
