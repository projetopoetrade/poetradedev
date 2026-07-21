import { NextResponse } from "next/server";
import { createClient } from "@sanity/client";
import { revalidatePath, revalidateTag } from "next/cache";

// Sob demanda: `createClient` lança se `projectId` faltar, e no escopo de
// módulo isso quebraria o build inteiro em vez de só esta rota.
function getSanityClient() {
    return createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
        apiVersion: "2023-05-03",
        useCdn: false,
        token: process.env.SANITY_API_KEY,
    });
}

// Converter texto simples do Python (separado por quebras de linha duplas) em blocos PortableText
function textToBlocks(text: string | any[]) {
    if (!text) return undefined;
    if (Array.isArray(text)) return text; // se o Python já mandar formatado, aceita

    return text
        .split('\n\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .map((p) => {
            const blockKey = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
            const spanKey = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
            return {
                _type: "block",
                _key: blockKey,
                style: "normal",
                children: [
                    {
                        _type: "span",
                        _key: spanKey,
                        marks: [],
                        text: p,
                    },
                ],
            };
        });
}

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        const secret = process.env.SANITY_HOOK_SECRET;

        // 1. Validação de Segurança
        if (!secret || authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parser do Payload
        const data = await req.json();
        const { name, slug, category, gameVersion, league, difficulty, contentEn, contentPtBr } = data;

        if (!slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        const body = {
            en: textToBlocks(contentEn) || [],
            pt_br: textToBlocks(contentPtBr) || [],
        };

        // 3. Checar se o Produto Existe
        const query = `*[_type == "product" && slug.current == $slug][0]`;
        const existingProduct = await getSanityClient().fetch(query, { slug });

        if (existingProduct) {
            // 4a. Update Logic
            const updatePayload: any = { body, updatedAt: new Date().toISOString() };

            // Atualiza os outros campos caso o script Python resolver mandá-los
            if (name) updatePayload.name = name;
            if (category) updatePayload.category = category;
            if (gameVersion) updatePayload.gameVersion = gameVersion;
            if (league) updatePayload.league = league;
            if (difficulty) updatePayload.difficulty = difficulty;

            const updated = await getSanityClient().patch(existingProduct._id).set(updatePayload).commit();

            // Revalida o cache
            revalidateTag("product");
            revalidatePath(`/products/${slug}`);
            revalidatePath(`/pt-br/products/${slug}`);

            return NextResponse.json({ message: "Product updated successfully", id: updated._id, action: "update" });

        } else {
            // 4b. Create Logic
            if (!name || !category || !gameVersion || !league || !difficulty) {
                return NextResponse.json(
                    { error: "To create a new product you must send name, category, gameVersion, league, and difficulty" },
                    { status: 400 }
                );
            }

            const newProduct = {
                _type: "product",
                name,
                slug: { _type: "slug", current: slug },
                category,
                gameVersion,
                league,
                difficulty,
                body,
                updatedAt: new Date().toISOString(),
            };

            const created = await getSanityClient().create(newProduct);

            revalidateTag("product");

            return NextResponse.json({ message: "Product created successfully", id: created._id, action: "create" });
        }
    } catch (error: any) {
        console.error("Sanity webhook error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
