import axios from 'axios';
import * as cheerio from 'cheerio';
import FormData from 'form-data';
import { query } from './db.js';

const CSIR_URL = 'https://techindiacsir.anusandhan.net/online/Control.do';

async function scrapeTechDetail(techId: string) {
    try {
        const form = new FormData();
        form.append('_tech', '');
        form.append('techId', techId);
        form.append('methodName', 'displayTechDetail');

        const response = await axios.post(CSIR_URL, form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        const $ = cheerio.load(response.data);

        const title = $('.panel-heading h3').text().trim();
        const rows = $('.panel-body table tr');

        let data: any = { id: techId, title };

        rows.each((_, row) => {
            const label = $(row).find('td').first().text().trim().toLowerCase();
            const value = $(row).find('td').last().text().trim();

            if (label.includes('value proposition')) data.valueProposition = value;
            if (label.includes('application')) data.application = value;
            if (label.includes('advantages')) data.advantages = value;
            if (label.includes('readiness level')) data.trl = value;
            if (label.includes('industrial applications')) data.category = value;
            if (label.includes('patent')) data.patent = value;
        });

        // Extract Lab Name and Contact from sidebar
        const labName = $('.panel.panel-default').last().find('.panel-heading h3').text().trim();
        const email = $('.panel.panel-default').last().find('a[href^="mailto:"]').text().trim();

        data.labName = labName;
        data.email = email;

        return data;
    } catch (err) {
        console.error(`Failed to scrape ${techId}:`, err);
        return null;
    }
}

async function startMigration() {
    // Full list of IDs extracted from the previous step
    const allIds = [
        "T-1411", "T-1410", "T-1298", "T-958", "T-1524", "T-1542", "T-1543", "T-1541", "T-1540", "T-1539",
        "T-1729", "T-1121", "T-1771", "T-1438", "T-1761", "T-596", "T-493", "T-1243", "T-1728", "T-1720",
        "T-1245", "T-1800", "T-1725", "T-1742", "T-1655", "T-1466", "T-1464", "T-681", "T-939", "T-1465",
        "T-526", "T-865", "T-1794", "T-882", "T-1620", "T-1716", "T-1690", "T-835", "T-1396", "T-1467",
        "T-1780", "T-1770", "T-508", "T-900", "T-291", "T-1282", "T-992", "T-1412", "T-42", "T-1157"
        // ... I will provide the script with a mechanism to fetch other IDs or include them in chunks
    ];

    console.log(`🚀 Starting migration for ${allIds.length} records...`);

    for (const id of allIds) {
        console.log(`🔍 Scraping ${id}...`);
        const details = await scrapeTechDetail(id);

        if (details) {
            // 1. Ensure Lab exists as Stakeholder
            const stakeholderId = `lab_${details.labName.replace(/\s+/g, '_').toLowerCase()}`;
            await query(`
        INSERT INTO stakeholders (stakeholder_id, name, category, website, contact_email, is_verified, roles)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (stakeholder_id) DO UPDATE SET name = EXCLUDED.name
      `, [stakeholderId, details.labName, 'Research Institution', '', details.email, true, JSON.stringify(['Provider'])]);

            // 2. Insert Technology
            const trlMatch = details.trl.match(/\d+/);
            const trlLevel = trlMatch ? parseInt(trlMatch[0]) : 1;

            await query(`
        INSERT INTO technologies (id, name, stakeholder_id, tech_category_id, description, ip_status, patent_number, trl_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          trl_level = EXCLUDED.trl_level
      `, [
                id,
                details.title,
                stakeholderId,
                details.category.split(',')[0].trim() || 'General',
                details.valueProposition,
                details.patent !== 'N/A' ? 'patented' : 'know-how',
                details.patent !== 'N/A' ? details.patent : null,
                trlLevel
            ]);

            console.log(`✅ Saved ${details.title}`);
        }
    }
}

startMigration();
