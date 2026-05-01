import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function processDirectory(dir: string, binPath: string, modelsPath: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            await processDirectory(fullPath, binPath, modelsPath);
        } else if (entry.isFile() && entry.name.endsWith('.webp') && !entry.name.includes('-temp')) {
            console.log(`✨ Upscaling: ${entry.name}...`);
            
            const tempOutputFile = `${path.parse(entry.name).name}-temp.webp`;
            const tempOutputPath = path.join(dir, tempOutputFile);

            const args = [
                '-i', fullPath,
                '-o', tempOutputPath,
                '-m', modelsPath,
                '-n', 'realesrgan-x4plus', 
                '-s', '4', 
                '-f', 'webp'
            ];

            try {
                await execFileAsync(binPath, args);
                if (fs.existsSync(tempOutputPath)) {
                    fs.unlinkSync(fullPath);
                    fs.renameSync(tempOutputPath, fullPath);
                    console.log(`  ✅ Done!`);
                }
            } catch (error: any) {
                console.error(`  ❌ Error upscaling ${entry.name}:`, error.message);
            }
        }
    }
}

async function run() {
    console.log("🚀 Starting Item Icons Upscale...");
    const itemsDir = path.resolve(process.cwd(), 'public', 'images', 'items');
    const binPath = path.resolve(process.cwd(), 'node_modules', 'upscayl-node', 'dist', 'upscaler', 'sub-classes', 'driver', 'command-upscayl', 'resources', 'win', 'bin', 'upscayl-bin.exe');
    const modelsPath = path.resolve(process.cwd(), 'node_modules', 'upscayl-node', 'dist', 'upscaler', 'sub-classes', 'model-manager', 'models');

    if (!fs.existsSync(itemsDir)) {
        console.error("❌ Items directory not found!");
        return;
    }

    await processDirectory(itemsDir, binPath, modelsPath);
    console.log("🎉 Upscale complete!");
}

run();
