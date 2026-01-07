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
            }
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
