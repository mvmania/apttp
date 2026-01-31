import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_URL = 'https://techindiacsir.anusandhan.net/online/Control.do?_tech=';
const OUTPUT_FILE = path.join(__dirname, 'csir_technologies.json');

interface ScrapedTechnology {
    title: string;
    url: string;
    description: string;
    institute: string;
    trl: string;
    raw_text: string;
}

async function scrapeCSIR() {
    console.log(`🚀 fetching ${TARGET_URL}...`);
    try {
        const response = await axios.get(TARGET_URL);
        const html = response.data;
        const $ = cheerio.load(html);
        const technologies: ScrapedTechnology[] = [];

        // Based on the markdown output inspection, the structure appears to be a list of items.
        // We need to be flexible with selectors as we haven't seen the raw HTML classes.
        // Usually these lists are in <table>, <ul>, or repeated <div>s.
        // A common pattern in older Java/Struts apps (implied by .do) is tables or nested divs.

        // Strategy: Look for the technology links and traverse up/siblings to find context.
        // The markdown showed titles as links.

        // Let's look for known container or loop over links.
        // Inspecting the markdown structure:
        // Title (Link) -> Description -> Institute: ... -> TRL ...

        // We will select all 'a' tags that look like technology headers.
        // Note: Without exact classes, we might need to filter.
        // However, reading the text content showed "Technologies for Transfer" header.

        // Let's try to find a container first.
        const mainContent = $('body'); // Fallback

        // We'll traverse all links.
        $('a').each((i, el) => {
            const link = $(el);
            const href = link.attr('href');
            const title = link.text().trim();

            // Filter relevant links (e.g., containing '-tech.htm' based on previous markdown urls)
            if (href && href.includes('-tech.htm')) {
                const fullUrl = href.startsWith('http') ? href : `https://techindiacsir.anusandhan.net${href}`;

                // The description and metadata usually follow the link in the DOM.
                // It might be in the same parent or next siblings.
                const parent = link.parent();
                const containerText = parent.text().trim();

                // Extract Institute
                let institute = 'Unknown';
                const instMatch = containerText.match(/Institute:\s*(CSIR-[A-Z]+)/i);
                if (instMatch) institute = instMatch[1];

                // Extract TRL
                let trl = 'Unknown';
                const trlMatch = containerText.match(/Technology Readiness Level\s*(TRL-\d+)/i);
                if (trlMatch) trl = trlMatch[1];

                // Extract Description (Crude approximation: remove known parts)
                let description = containerText
                    .replace(title, '')
                    .replace(/Institute:.*/s, '') // Remove from Institute onwards
                    .replace(/Technology Readiness Level.*/s, '')
                    .trim();

                technologies.push({
                    title,
                    url: fullUrl,
                    description,
                    institute,
                    trl,
                    raw_text: containerText // Keep raw text for AI processing later
                });
            }
        });

        console.log(`✅ Scraped ${technologies.length} technologies.`);

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(technologies, null, 2));
        console.log(`💾 Saved to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('❌ Scraping failed:', error);
    }
}

scrapeCSIR();
