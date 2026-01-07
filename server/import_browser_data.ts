import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = 'https://apttp.onrender.com/api';

const scrapedData = [
    {
        "Title": "Colorimetric Kit for detection of Selenium (10 ppb-1000 ppb)",
        "Lab Name": "CSIR-Central Scientific Instruments Organisation[CSIR-CSIO]",
        "Value Proposition": "Selenium has emerged as a water pollutant of concern over a few years in Indian states...",
        "Application": "Water Resources Testing for Selenium",
        "Advantages": "On-site detection of selenium in water",
        "TRL": "Lab Validation (TRL-5)",
        "Category": "CleanTech",
        "Patent": "IN202111043409",
        "Lab Email": "director[at]csio[dot]res[dot]in"
    },
    {
        "Title": "V Treat: A Wearable Pressurised Air Purifying Breather with SARS CoV2 Deactivation (Wet Unit)",
        "Lab Name": "CSIR-Central Scientific Instruments Organisation[CSIR-CSIO]",
        "Value Proposition": "To provide a safe, breathable solution to medicos while working in high-risk areas...",
        "Application": "The device can be primarily been used in hospitals...",
        "Advantages": "Wearable with PPE Kits, long lasting for 6-8 hours...",
        "TRL": "Technology Demonstration (TRL-7)",
        "Category": "Bio techniques, Chemical Techniques, CleanTech",
        "Patent": "Design Registration Filed, 2021, No. 006DN2022",
        "Lab Email": "director[at]csio[dot]res[dot]in"
    },
    {
        "Title": "UV-C Disinfection Systems",
        "Lab Name": "CSIR-Central Scientific Instruments Organisation[CSIR-CSIO]",
        "Value Proposition": "CSIR-CSIO has developed and engineered Induct UV-C disinfectant system...",
        "Application": "Air-ducts of HVAC SYSTEMS...",
        "Advantages": "Ergonomic Design Retrofit, Minimal Changes...",
        "TRL": "Market Launch (TRL-9)",
        "Category": "Devices, Devices and Equipments",
        "Patent": "Not listed",
        "Lab Email": "director[at]csio[dot]res[dot]in"
    },
    {
        "Title": "Novel Anti-osteoporosis Drug Candidate CDRI-99/373",
        "Lab Name": "CSIR-Central Drug Research Institute[CSIR-CDRI]",
        "Value Proposition": "A novel small molecule (aryl napthyl derivative) which is a potent anti-resorptive agent...",
        "Application": "Treatment of osteoporosis as a potent anti-resorptive agent...",
        "Advantages": "No estrogenic/anti-estrogenic effect...",
        "TRL": "Technology Development (TRL-6)",
        "Category": "Drugs",
        "Patent": "1045/DEL/2005",
        "Lab Email": "director[at]cdri[dot]res[dot]in"
    },
    {
        "Title": "CSIR-SCAN - Molecular Kit for Screening and Confirmation of Sickle Cell Anemia",
        "Lab Name": "CSIR-Centre for Cellular and Molecular Biology[CSIR-CCMB]",
        "Value Proposition": "A one-step molecular test for detection of the mutation causing Sickle Cell Anaemia...",
        "Application": "Discrimination between normal, carrier and patients...",
        "Advantages": "Direct use of blood (no DNA isolation needed)...",
        "TRL": "Concept Definition (TRL-2)",
        "Category": "Biotechnology",
        "Patent": "IN201911038617, CN114466937, EP4034680, US20220372575, JP2022549826",
        "Lab Email": "director[at]ccmb[dot]res[dot]in"
    }
];

const idMap: any = {
    "Colorimetric Kit for detection of Selenium (10 ppb-1000 ppb)": "T-1411",
    "V Treat: A Wearable Pressurised Air Purifying Breather with SARS CoV2 Deactivation (Wet Unit)": "T-1410",
    "UV-C Disinfection Systems": "T-1298",
    "Novel Anti-osteoporosis Drug Candidate CDRI-99/373": "T-958",
    "CSIR-SCAN - Molecular Kit for Screening and Confirmation of Sickle Cell Anemia": "T-1524"
};

async function runImport() {
    for (const item of scrapedData as any[]) {
        const id = idMap[item.Title] || `T-manual-${Date.now()}`;
        const labName = item["Lab Name"];
        const stakeholderId = `lab_${labName.replace(/[^\w]/g, '_').toLowerCase()}`;
        const trlMatch = item.TRL.match(/\d+/);
        const trlLevel = trlMatch ? parseInt(trlMatch[0]) : 1;

        const payload = {
            tech: {
                id: id,
                name: item.Title,
                stakeholder_id: stakeholderId,
                tech_category_id: item.Category ? item.Category.split(',')[0].trim() : 'General',
                description: item.ValueProposition,
                ip_status: (item.Patent && item.Patent !== 'Not listed') ? 'patented' : 'know-how',
                patent_number: (item.Patent && item.Patent !== 'Not listed') ? item.Patent : null,
                trl_level: trlLevel
            },
            stakeholder: {
                stakeholder_id: stakeholderId,
                name: labName,
                category: 'Research Institution',
                website: '',
                contact_email: item["Lab Email"].replace(/\[at\]/g, '@').replace(/\[dot\]/g, '.')
            }
        };

        try {
            await axios.post(`${API_BASE_URL}/technologies/import`, payload);
            console.log(`✅ Imported ${id}: ${item.Title}`);
        } catch (e: any) {
            console.error(`❌ Error importing ${id}:`, e.response?.data?.error || e.message);
        }
    }
}

runImport();
