import { query } from './db.js';

async function seedSamples() {
    console.log('🌱 Seeding sample CSIR data...');

    try {
        // 1. Add CSIR-CSIO as a stakeholder if it doesn't exist
        const stakeholderId = 's_csir_csio';
        await query(`
      INSERT INTO stakeholders (
        stakeholder_id, name, category, description, legal_address, website, contact_email, is_verified, roles
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (stakeholder_id) DO NOTHING
    `, [
            stakeholderId,
            'CSIR-Central Scientific Instruments Organisation [CSIR-CSIO]',
            'Research and academic institution',
            'A premier national laboratory of the Council of Scientific and Industrial Research (CSIR), dedicated to research and development in the field of scientific and industrial instrumentation.',
            'Chandigarh, India',
            'https://www.csio.res.in',
            'director@csio.res.in',
            true,
            JSON.stringify(['Provider'])
        ]);

        const samples = [
            {
                id: 't_csir_1',
                name: "Colorimetric Kit for detection of Selenium (10 ppb-1000 ppb)",
                tech_category_id: "CleanTech",
                description: "Selenium has emerged as a water pollutant of concern. This simple multimodal colorimetric method was developed to detect selenium as a nutrient/pollutant with high accuracy.",
                ip_status: "patented",
                patent_number: "IN202111043409",
                trl_level: 5,
                image_url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1200"
            },
            {
                id: 't_csir_2',
                name: "V Treat: Wearable Air Purifying Breather",
                tech_category_id: "Healthcare",
                description: "A pressurized air purifying breather (PAPB) with SARS CoV2 deactivation. 3-tier air treatment (physical, chemical, and UV) for frontline workers.",
                ip_status: "filed",
                patent_number: "006DN2022",
                trl_level: 7,
                image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200"
            },
            {
                id: 't_csir_3',
                name: "UV-C Disinfection Systems for HVAC",
                tech_category_id: "Healthcare",
                description: "Induct UV-C disinfectant system designed to be integrated into HVAC air ducts for deactivation of viruses, bacteria, and fungi in large environments.",
                ip_status: "know-how",
                trl_level: 9,
                image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200"
            }
        ];

        for (const t of samples) {
            await query(`
        INSERT INTO technologies (
          id, name, stakeholder_id, tech_category_id, description, ip_status, patent_number, trl_level, image_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING
      `, [
                t.id, t.name, stakeholderId, t.tech_category_id, t.description, t.ip_status, t.patent_number || null, t.trl_level, t.image_url
            ]);
        }

        console.log('✅ Sample data seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedSamples();
