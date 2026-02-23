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
        const doc = await client.fetch('*[_type == "league" && slug.current == "keepers-of-the-flame"][0]');
        console.log(JSON.stringify(doc, null, 2));
    } catch (err) {
        console.error(err);
    }
}

main();
