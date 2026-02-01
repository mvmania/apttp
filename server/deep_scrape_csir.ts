import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'csir_technologies.json');
const OUTPUT_FILE = path.join(__dirname, 'csir_technologies_detailed.json');

// Helper for delay to avoid rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function deepScrape() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('❌ Input file not found');
        return;
    }

    const technologies = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    console.log(`🚀 Starting deep scrape for ${technologies.length} items...`);

    const detailedTechs = [];
    const BATCH_SIZE = 10; // Concurrent requests

    // We can skip items that don't have a valid URL or are duplicates if we want,
    // but better to process all unique URLs.
    // Let's filter unique URLs first.
    const uniqueTechs = [];
    const seenUrls = new Set();
    for (const t of technologies) {
        if (t.url && !seenUrls.has(t.url)) {
            seenUrls.add(t.url);
            uniqueTechs.push(t);
        }
    }
    console.log(`ℹ️ Processing ${uniqueTechs.length} unique URLs.`);

    for (let i = 0; i < uniqueTechs.length; i += BATCH_SIZE) {
        const batch = uniqueTechs.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i + 1} to ${Math.min(i + BATCH_SIZE, uniqueTechs.length)}...`);

        const promises = batch.map(async (tech: any) => {
            try {
                const response = await axios.get(tech.url, { timeout: 10000 });
                const $ = cheerio.load(response.data);

                // Initialize extended fields
                const details: any = { ...tech };

                // Extract all text from main content area (heuristically)
                // Often these sites have a main container like .content or similar.
                // We'll grab the whole body text or specific headers if possible.
                // Assuming standard headers like "Major Applications", "Techno-economics", etc.

                // Strategy: Get all paragraph text as 'full_content'
                // and try to parse specific sections.

                // Remove nav/footer to reduce noise (heuristic)
                $('nav, footer, header, .menu, .sidebar').remove();

                const fullText = $('body').text().replace(/\s+/g, ' ').trim();
                details.full_content = fullText;

                // Specific Extractors (adjust selectors based on actual page structure if known)
                // Let's look for common labels in text because classes might be messy.
                const findSection = (label: string) => {
                    // Find element containing label
                    // This is tricky with Cheerio pseudo-selectors sometimes, so we iterate.
                    // Simplified: just store full text for now since we don't know the exact DOM.
                    // But we can try to find headers.
                    return '';
                };

                // Extract Images if any (important for display)
                const images: string[] = [];
                $('img').each((_, img) => {
                    const src = $(img).attr('src');
                    if (src && !src.includes('logo') && !src.includes('icon') && src.length > 20) {
                        images.push(src.startsWith('http') ? src : `https://techindiacsir.anusandhan.net${src}`);
                    }
                });
                if (images.length > 0) details.image_urls = images;

                return details;

            } catch (err: any) {
                console.error(`❌ Failed to scrape ${tech.url}: ${err.message}`);
                // Return original with error note
                return { ...tech, scrape_error: true };
            }
        });

        const results = await Promise.all(promises);
        detailedTechs.push(...results);

        // Save intermediate results every 50 items
        if (detailedTechs.length % 50 === 0) {
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(detailedTechs, null, 2));
            console.log(`💾 Checkpoint saved (${detailedTechs.length} items)`);
        }

        // Random delay between batches
        await sleep(500);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(detailedTechs, null, 2));
    console.log(`\n🎉 Deep scrape finished. Saved to ${OUTPUT_FILE}`);
}

deepScrape();
