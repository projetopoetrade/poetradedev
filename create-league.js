const { createClient } = require('@sanity/client');

const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    apiVersion: '2023-05-03',
    useCdn: false,
    token: process.env.SANITY_API_KEY,
});

async function main() {
    try {
        const doc = {
            _type: 'league',
            title: 'Keepers of the Flame',
            subtitle: 'Path of Exile 2: Early Access League',
            slug: {
                _type: 'slug',
                current: 'keepers-of-the-flame',
            },
            gameVersion: 'path-of-exile-2',
            status: 'live',
            patchVersion: '3.27',
            launchDate: '2024-12-06T19:00:00.000Z',
            datePublished: '2024-12-06',

            // TLDR Section
            tldr: {
                title: 'Quick Summary',
                items: [
                    { text: 'New Keepers of the Flame mechanic: Cleansing ancient pyres', type: 'new' },
                    { text: 'Massive changes to early game progression', type: 'buff' },
                    { text: 'Adjustments to crafting drop rates', type: 'neutral' },
                ]
            },

            // Mechanics Section
            mechanics: {
                title: 'League Mechanics Explained',
                description: 'The Keepers of the Flame are an ancient order tasked with maintaining the balance of fire across Wraeclast. Players will encounter their corrupted pyres and must cleanse them.',
                points: [
                    {
                        title: 'Corrupted Pyres',
                        description: 'Encountered in every zone, activating them spawns waves of fire-imbued enemies.',
                    },
                    {
                        title: 'Flame Embers',
                        description: 'New currency items dropped by the pyres used to craft potent fire modifiers on weapons.',
                    }
                ],
                tradeImpact: {
                    title: 'Economic Impact',
                    points: [
                        'Divine Orbs see higher demand due to new meta crafting options.',
                        'Flame embers become the standard bridging currency in early maps.'
                    ]
                }
            },

            // Patch Notes Section
            patchNotes: {
                title: 'Patch Notes Highlights',
                subtitle: 'Key changes in 3.27',
                officialUrl: 'https://www.pathofexile.com/forum/view-forum/patch-notes',
                officialText: 'Read full 3.27 Patch Notes',
                categories: [
                    {
                        title: 'Character Balance',
                        changes: [
                            'Melee skills received a 20% damage effectiveness increase across the board.',
                            'Spell suppression is now harder to cap on the right side of the passive tree.'
                        ]
                    },
                    {
                        title: 'Quality of Life',
                        changes: [
                            'Currency items now stack to 5000 in the currency stash tab.',
                            'Trade improvements: Direct whisper from the website.'
                        ]
                    }
                ]
            },

            // Starters Section
            starters: {
                title: 'League Starter Builds',
                subtitle: 'Top tier tested builds for Day 1',
                tierS: {
                    title: 'S-Tier — Top Performers',
                    description: 'Elite builds capable of pushing all content early.'
                },
                tierA: {
                    title: 'A-Tier — Reliable Mappers',
                    description: 'Solid choices for atlas progression and currency farming.'
                },
                builds: [
                    {
                        _key: 'b1',
                        name: 'Infernal Blow',
                        class: 'Marauder',
                        tier: 'S',
                        difficulty: 'Medium',
                        description: 'A powerful starter that scales perfectly with early gear and the new Flame Embers.',
                        pros: ['Excellent clear speed', 'High single target damage'],
                        cons: ['Requires positioning', 'Melee playstyle'],
                        guideUrl: 'https://youtube.com',
                        author: 'Fubgun'
                    },
                    {
                        _key: 'b2',
                        name: 'Ice Nova',
                        class: 'Sorceress',
                        tier: 'A',
                        difficulty: 'Easy',
                        description: 'The undisputed king of cheap screen clear. Perfect for generating early currency.',
                        pros: ['Screen-wide freezing', 'Very cheap to start'],
                        cons: ['Squishy against bosses', 'Mana intensive'],
                        guideUrl: 'https://youtube.com',
                        author: 'Palsteron'
                    }
                ]
            },

            ctaLink: '/products?gameVersion=path-of-exile-2&league=Keepers+of+the+Flame',

            seoTitle: 'PoE 3.27 Keepers of the Flame — League Guide, Patch Notes, Builds & Buy Currency',
            seoDescription: 'Complete guide for Keepers of the Flame league (3.27): mechanics, QoL, economic impact, patch notes, recommended starters and where to buy Divines and other currency.',
        };

        console.log('Migrating Keepers of the Flame (v2 schema) into Sanity...');
        const result = await client.create(doc);
        console.log(`Migration Complete! Document ID: ${result._id}`);
    } catch (err) {
        console.error('Error creating document:', err);
    }
}

main();
