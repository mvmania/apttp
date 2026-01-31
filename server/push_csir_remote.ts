import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'csir_technologies.json');
const API_URL = 'https://apttp.onrender.com/api/technologies/import';
// const API_URL = 'http://localhost:10000/api/technologies/import'; // For local testing if needed

async function pushRemote() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ Data file not found:', DATA_FILE);
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`📂 Loaded ${data.length} records. Pushing to ${API_URL}...`);

    let success = 0;
    let failed = 0;

    // Process in chunks to avoid overwhelming the server
    const CHUNK_SIZE = 5;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map(async (item: any) => {
            const orgName = item.institute || 'Unknown Institute';
            const stakeholderId = `s_${orgName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50)}`;
            // Extract T-XXXX ID from URL or generate a hash from title
            let uniquePart = '';
            const idMatch = (item.url || '').match(/(T-\d+)/);
            if (idMatch) {
                uniquePart = idMatch[1];
            } else {
                // Fallback: simple hash of title
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

            const payload = {
                tech: {
                    id: techId,
                    name: item.title,
                    stakeholder_id: stakeholderId,
                    tech_category_id: 'General',
                    description: item.description || item.raw_text?.substring(0, 500) || 'No description',
                    ip_status: 'know-how',
                    trl_level: trlLevel
                },
                stakeholder: {
                    stakeholder_id: stakeholderId,
                    name: orgName,
                    category: 'Research Institution',
                    website: '',
                    contact_email: ''
                }
            };

            try {
                await axios.post(API_URL, payload);
                process.stdout.write('.');
                return true;
            } catch (e: any) {
                // process.stdout.write('x');
                // console.error(`\nFailed: ${item.title} - ${e.message}`);
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
