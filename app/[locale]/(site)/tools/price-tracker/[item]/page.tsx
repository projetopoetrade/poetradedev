import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, TrendingUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import PriceHistoryChart from '@/components/Product/PriceHistoryChart'

interface PageProps {
    params: Promise<{
        locale: string
        item: string
    }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { item, locale } = await params

    // Format slug back to name (e.g. mirror-of-kalandra -> Mirror of Kalandra)
    const decodedItem = decodeURIComponent(item).replace(/-/g, ' ')
    const capitalizedItem = decodedItem.replace(/\b\w/g, l => l.toUpperCase())

    return {
        title: `${capitalizedItem} Price Tracker & Market Trend | Path of Trade`,
        description: `Track live ${capitalizedItem} prices and historical market trends in Path of Exile. Analyze the market value across leagues with poe.ninja data.`,
        alternates: {
            canonical: `/${locale}/tools/price-tracker/${item}`,
        },
        openGraph: {
            title: `${capitalizedItem} Price Tracker`,
            description: `Track the exact price history and market value of ${capitalizedItem} in Path of Exile.`,
        }
    }
}

export default async function TrackerItemPage({ params }: PageProps) {
    const { item, locale } = await params

    const decodedItem = decodeURIComponent(item).replace(/-/g, ' ')
    const formattedName = decodedItem.replace(/\b\w/g, l => l.toUpperCase())

    const supabase = await createClient()

    // Find if we sell this exact item to provide a "Buy Now" button
    const { data: ourProduct } = await supabase
        .from('products')
        .select('slug, price, in_stock')
        .ilike('name', formattedName)
        .limit(1)
        .single()

    return (
        <div className="container py-8 max-w-5xl mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="flex items-center text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2">
                    <li>
                        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                    </li>
                    <li><ChevronRight className="h-4 w-4" /></li>
                    <li>
                        <Link href="/tools/price-tracker" className="hover:text-foreground transition-colors">Price Tracker</Link>
                    </li>
                    <li><ChevronRight className="h-4 w-4" /></li>
                    <li className="text-foreground font-medium" aria-current="page">
                        {formattedName}
                    </li>
                </ol>
            </nav>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                        {formattedName} Market Price
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                        Live tracker for {formattedName} market values from the active leagues. Analyze the 30-day historical trend below.
                    </p>
                </div>

                {ourProduct && ourProduct.in_stock && (
                    <Link
                        href={`/products/${ourProduct.slug}`}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2"
                    >
                        Buy {formattedName} for ${ourProduct.price}
                    </Link>
                )}
            </div>

            {/* Chart Section */}
            <section className="mb-12">
                <PriceHistoryChart productSlug={item} />
            </section>

            {/* Programmatic SEO content chunk */}
            <section className="bg-muted/30 rounded-xl p-6 border border-border/50 text-sm leading-relaxed text-muted-foreground">
                <h2 className="text-foreground font-semibold text-lg mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    About {formattedName} Economy
                </h2>
                <p>
                    The market value of <strong>{formattedName}</strong> constantly fluctuates based on league progression, player demand, and meta shifts.
                    Use the price chart above to determine if it is currently a buyer's or seller's market before converting your Chaos or Divine Orbs.
                    The data is consolidated every hour directly from poe.ninja indices across active realms.
                </p>
            </section>

            {/* Return Action */}
            <div className="mt-8">
                <Link
                    href="/tools/price-tracker"
                    className="text-sm text-primary hover:underline"
                >
                    &larr; Back to full Price Tracker
                </Link>
            </div>
        </div>
    )
}
