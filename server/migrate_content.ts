import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
dotenv.config({ path: '.env.local' });
dotenv.config();
import { query } from './db.js';

async function migrateContent() {
    console.log('🚀 Starting Content Migration...');

    try {
        // 1. Create Table
        console.log('📝 Creating site_content table...');
        await query(`
            CREATE TABLE IF NOT EXISTS site_content (
                key VARCHAR(255) PRIMARY KEY,
                content TEXT,
                description TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Seed Data
        const initialData = [
            {
                key: 'home_hero_title',
                description: 'Main title on the landing page hero section',
                content: 'Accelerating <span class="text-apctt-blue italic">Innovation</span> across Asia-Pacific.'
            },
            {
                key: 'home_hero_subtitle',
                description: 'Subtitle text on the landing page hero section',
                content: 'The official APCTT platform connecting technology providers, seekers, and investors. Bridging the gap between groundbreaking innovation and regional development.'
            },
            {
                key: 'footer_developed_by',
                description: 'Partnership text in the footer',
                content: 'Developed in strategic partnership with <span class="text-slate-500 font-bold">RH ISTC</span>.'
            },
            {
                key: 'about_rh_istc_desc',
                description: 'Description of RH ISTC on the About page',
                content: 'The RH ISTC is a premier institution dedicated to fostering international scientific collaboration and technology transfer. Partnering with APCTT, the RH ISTC plays a pivotal role in connecting Russian technologies and scientific expertise with the Asia-Pacific region, driving innovation and sustainable development through cross-border cooperation.'
            },
            // Landing Stats
            { key: 'landing_stats_innovations_label', description: 'Label for Innovations stat', content: 'Innovations' },
            { key: 'landing_stats_innovations_value', description: 'Value for Innovations stat', content: '1,200+' },
            { key: 'landing_stats_countries_label', description: 'Label for Countries stat', content: 'Countries' },
            { key: 'landing_stats_countries_value', description: 'Value for Countries stat', content: '45+' },
            { key: 'landing_stats_partners_label', description: 'Label for Partners stat', content: 'Partners' },
            { key: 'landing_stats_partners_value', description: 'Value for Partners stat', content: '800+' },
            { key: 'landing_stats_transfers_label', description: 'Label for Transfers stat', content: 'Transfers' },
            { key: 'landing_stats_transfers_value', description: 'Value for Transfers stat', content: '150+' },
            // Landing Sections
            { key: 'landing_recent_tech_title', description: 'Title for Recent Technologies section', content: 'Recently Added Technologies' },
            { key: 'landing_recent_tech_subtitle', description: 'Subtitle for Recent Technologies section', content: 'The latest technical assets ready for licensing and collaboration.' },
            { key: 'landing_updates_title', description: 'Title for Updates section', content: 'Latest Network <br /> Updates' },
            { key: 'landing_updates_subtitle', description: 'Subtitle for Updates section', content: 'Stay informed about regional forums, site tours, and technical support programs organized by our members.' },
            { key: 'landing_featured_stakeholders_title', description: 'Title for Featured Stakeholders section', content: 'Our Verified Network' },
            { key: 'landing_featured_stakeholders_subtitle', description: 'Subtitle for Featured Stakeholders section', content: 'Leading organizations driving regional technology transfer.' },
            { key: 'landing_cta_title', description: 'Title for CTA section', content: 'Ready to expand your technical reach?' },
            { key: 'landing_cta_subtitle', description: 'Subtitle for CTA section', content: 'Join hundreds of organizations across the Asia-Pacific. Register your technology or post your technical needs today.' },
            // About Page
            { key: 'about_title', description: 'Main title on About page', content: 'About the Platform' },
            { key: 'about_subtitle', description: 'Subtitle on About page', content: 'Bridging the gap between innovation and implementation across the Asia-Pacific region.' },
            { key: 'about_apctt_title', description: 'Title for APCTT section', content: 'Asia-Pacific Centre for Transfer of Technologies (APCTT)' },
            { key: 'about_apctt_desc', description: 'Description for APCTT section', content: 'APCTT is a regional institution of the United Nations Economic and Social Commission for Asia and the Pacific (ESCAP) servicing the Asia-Pacific region. Our focus is on institutional capacity-building for the management of the innovation chain, including technology transfer and adoption of new technologies.' },
            { key: 'about_mission_title', description: 'Title for Mission block', content: 'Our Mission' },
            { key: 'about_mission_desc', description: 'Description for Mission block', content: 'To facilitate technology transfer and partnership building for sustainable development in Asia and the Pacific.' },
            { key: 'about_connect_title', description: 'Title for Connect block', content: 'Connect Stakeholders' },
            { key: 'about_connect_desc', description: 'Description for Connect block', content: 'We bring together technology providers, seekers, and investors under one digital roof.' },
            { key: 'about_drive_title', description: 'Title for Drive Innovation block', content: 'Drive Innovation' },
            { key: 'about_drive_desc', description: 'Description for Drive Innovation block', content: 'Empowering regional economies through smart matchmaking and knowledge dissemination.' },
            // Footer
            { key: 'footer_copyright', description: 'Copyright text in footer', content: '© 2024 Asia-Pacific Centre for Transfer of Technologies.' }
        ];

        console.log('🌱 Seeding initial content...');
        for (const item of initialData) {
            await query(`
                INSERT INTO site_content (key, content, description)
                VALUES ($1, $2, $3)
                ON CONFLICT (key) DO NOTHING
            `, [item.key, item.content, item.description]);
        }

        console.log('✅ Content migration finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Content migration failed:', err);
        process.exit(1);
    }
}

migrateContent();
