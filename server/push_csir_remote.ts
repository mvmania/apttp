import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'csir_technologies_detailed.json');
const API_URL = 'https://apttp.onrender.com/api/technologies/import';

async function pushRemote() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ Data file not found:', DATA_FILE);
        return;
    }

    const rawData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`📂 Loaded ${rawData.length} detailed records. Parsing and Pushing...`);

    let success = 0;
    let failed = 0;

    const CHUNK_SIZE = 5;
    for (let i = 0; i < rawData.length; i += CHUNK_SIZE) {
        const chunk = rawData.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(async (item: any) => {
            const orgName = item.institute || 'Unknown Institute';
            const stakeholderId = `s_${orgName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50)}`;

            // Extract T-XXXX ID logic (same as before)
            let uniquePart = '';
            const idMatch = (item.url || '').match(/(T-\d+)/);
            if (idMatch) {
                uniquePart = idMatch[1];
            } else {
                let hash = 0;
                const str = item.title + (item.url || '');
                for (let j = 0; j < str.length; j++) {
                    hash = ((hash << 5) - hash) + str.charCodeAt(j);
                    hash |= 0;
                }
                uniquePart = 'gen_' + Math.abs(hash);
            }
            const techId = `t_csir_${uniquePart}`;

            let trlLevel = 1;
            const trlMatch = (item.trl || '').match(/(\d+)/);
            if (trlMatch) trlLevel = parseInt(trlMatch[1]);

            // RICH DESCRIPTION PARSING
            let description = '';
            if (item.full_content) {
                // Remove JS garbage
                let text = item.full_content.replace(/document\.addEventListener.*?Title:/s, 'Title:');
                text = text.replace(/\$\("#1"\)\.addClass.*/s, '');

                // Helper to extract section
                const extract = (key: string) => {
                    const regex = new RegExp(`${key}:(.*?)(?=(Value Proposition:|Summary Application:|Advantages:|Commercialization Status:|Tech\. Readiness Level:|Industrial Applications:|$))`, 'i');
                    const match = text.match(regex);
                    return match ? match[1].trim() : '';
                };

                const valProp = extract('Value Proposition');
                const app = extract('Summary Application');
                const adv = extract('Advantages');

                if (valProp) description += `VALUE PROPOSITION\n${valProp}\n\n`;
                if (app) description += `APPLICATIONS\n${app}\n\n`;
                if (adv) description += `ADVANTAGES\n${adv}\n\n`;

                // Fallback if extraction failed but text exists
                if (description.length < 10) {
                    description = text.substring(0, 2000);
                }
            }

            if (!description || description.trim().length < 5) {
                description = item.description || item.raw_text || 'No description available';
            }

            // Clean up description length for DB
            description = description.substring(0, 4000); // 4000 char limit safety

            // Extract Contact Info
            let email = '';
            let website = '';
            if (item.full_content) {
                const emailMatch = item.full_content.match(/:?\s*([a-zA-Z0-9._-]+\[at\][a-zA-Z0-9._-]+(\[dot\][a-zA-Z0-9._-]+)+)/);
                if (emailMatch) email = emailMatch[1].replace(/\[at\]/g, '@').replace(/\[dot\]/g, '.');

                const urlMatch = item.full_content.match(/:(https?:\/\/[a-zA-Z0-9./-]+)/);
                if (urlMatch) website = urlMatch[1];
            }

            // Patent Parsing
            let patentNumber = '';
            let ipStatus = 'know-how';
            if (item.full_content) {
                const patMatch = item.full_content.match(/Patent\(s\):\s*([A-Z0-9,\s]+)/i);
                if (patMatch) {
                    patentNumber = patMatch[1].trim().replace(/\s+/g, ', '); // Normalize spaces to comma
                    ipStatus = 'patented'; // Assuming listed patents are granted or filed
                }
            }

            const payload = {
                tech: {
                    id: techId,
                    name: item.title || 'Untitled Technology',
                    stakeholder_id: stakeholderId,
                    tech_category_id: 'General',
                    description: description, // Already parsed above
                    ip_status: ipStatus,
                    patent_number: patentNumber || null,
                    trl_level: trlLevel,

                    image_url: item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null
                },
                stakeholder: {
                    stakeholder_id: stakeholderId,
                    name: orgName,
                    category: 'Research Institution',
                    website: website,
                    contact_email: email
                }
            };

            try {
                await axios.post(API_URL, payload);
                process.stdout.write('.');
                return true;
            } catch (e: any) {
                // console.error(e.message);
                process.stdout.write('x');
                return false;
            }
        });

        const results = await Promise.all(promises);
        success += results.filter(r => r).length;
        failed += results.filter(r => !r).length;
    }

    console.log(`\n✅ Remote Import Finished.`);
    console.log(`Success: ${success}`);
    console.log(`Failed: ${failed}`);
}

pushRemote();
