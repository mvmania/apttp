import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, 'csir_technologies.json');

function fixUrls() {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('File not found');
        return;
    }

    const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    let fixedCount = 0;

    const fixedData = data.map((item: any) => {
        if (item.url) {
            // Fix 1: Reconstruct from ID if possible
            const idMatch = (item.url || '').match(/(T-\d+)/);
            if (idMatch) {
                const id = idMatch[1];
                const newUrl = `https://techindiacsir.anusandhan.net/online/${id}-tech.htm`;
                if (item.url !== newUrl) {
                    item.url = newUrl;
                    fixedCount++;
                }
            } else if (item.url && item.url.includes('.net') && !item.url.includes('.net/')) {
                // Fallback for others
                if (item.url.startsWith('https://techindiacsir.anusandhan.net')) {
                    item.url = item.url.replace('.net', '.net/');
                    fixedCount++;
                }
            }
            // Fix 2: Sometimes relative paths were caught strangely?
            // "netdiv-strong" -> "net/div-strong" is handled by above.
        }
        return item;
    });

    fs.writeFileSync(INPUT_FILE, JSON.stringify(fixedData, null, 2));
    console.log(`✅ Fixed ${fixedCount} URLs in ${INPUT_FILE}`);
}

fixUrls();
