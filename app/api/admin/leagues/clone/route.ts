import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        // Authenticate the request via CRON_SECRET or ADMIN_SECRET
        const authHeader = req.headers.get("authorization");
        const secret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;

        // In production, enforce secret. (In your architecture, a user might also call this 
        // passing an Authorization header from the frontend logic).
        if (secret && authHeader !== `Bearer ${secret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { sourceLeague, targetLeague } = body;

        if (!sourceLeague || !targetLeague) {
            return NextResponse.json({ error: "Missing sourceLeague or targetLeague" }, { status: 400 });
        }

        if (sourceLeague === targetLeague) {
            return NextResponse.json({ error: "Source and target leagues must be different" }, { status: 400 });
        }

        console.log(`[League-Clone] Starting clone from ${sourceLeague} to ${targetLeague}`);
        const supabase = createAdminClient();

        // 1. Fetch all products from the source league
        const { data: sourceProducts, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('league', sourceLeague);

        if (fetchError) {
            console.error("[League-Clone] Error fetching source products:", fetchError);
            throw fetchError;
        }

        if (!sourceProducts || sourceProducts.length === 0) {
            return NextResponse.json({ message: `No products found in source league: ${sourceLeague}` }, { status: 404 });
        }

        // 2. Fetch existing products in target league to prevent duplicates
        const { data: targetProducts, error: targetFetchError } = await supabase
            .from('products')
            .select('name, gameVersion')
            .eq('league', targetLeague);

        if (targetFetchError) {
            console.error("[League-Clone] Error fetching target products:", targetFetchError);
            throw targetFetchError;
        }

        const existingTargetSet = new Set(
            (targetProducts || []).map(p => `${p.name}-${p.gameVersion}`)
        );

        // 3. Transform products for the new league
        const newProductsToInsert: any[] = [];

        for (const prod of sourceProducts) {
            const key = `${prod.name}-${prod.gameVersion}`;

            // Only insert if it doesn't already exist in the target league
            if (!existingTargetSet.has(key)) {
                // Destructure and remove specific unique identifiers (id, created_at, update_at)
                const { id, created_at, updated_at, ...productData } = prod;

                newProductsToInsert.push({
                    ...productData,
                    league: targetLeague,
                    price: 0,            // Reset price for the new economy
                    is_listed: false,    // Safe default to prevent instant public visibility
                    in_stock: false,     // Safe default
                });
            }
        }

        console.log(`[League-Clone] Preparing to insert ${newProductsToInsert.length} cloned items.`);

        // 4. Bulk insert clones
        if (newProductsToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('products')
                .insert(newProductsToInsert);

            if (insertError) {
                console.error("[League-Clone] Error inserting cloned products:", insertError);
                throw insertError;
            }
        }

        return NextResponse.json({
            success: true,
            sourceItemsCount: sourceProducts.length,
            clonedItemsCount: newProductsToInsert.length,
            message: `Successfully cloned ${newProductsToInsert.length} items from ${sourceLeague} to ${targetLeague}.`
        });

    } catch (error: any) {
        console.error("[League-Clone] Fatal Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
