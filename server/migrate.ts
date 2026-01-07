import { query } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

async function migrate() {
    console.log('🚀 Starting PostgreSQL migration...');

    try {
        // 1. Create Tables
        console.log('📝 Creating tables...');

        await query(`
      CREATE TABLE IF NOT EXISTS stakeholders (
        stakeholder_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT,
        description TEXT,
        legal_address TEXT,
        legal_document_id TEXT,
        website TEXT,
        contact_name TEXT,
        contact_email TEXT,
        phone TEXT,
        whatsapp_enabled BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        key_tech_areas JSONB DEFAULT '[]',
        roles JSONB DEFAULT '[]',
        investor_info JSONB
      );
    `);

        await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        scenario TEXT,
        stakeholder_id TEXT,
        is_verified BOOLEAN DEFAULT false,
        is_email_verified BOOLEAN DEFAULT false,
        is_id_verified BOOLEAN DEFAULT false,
        verification_status TEXT,
        is_admin BOOLEAN DEFAULT false,
        joined_date BIGINT
      );
    `);

        await query(`
      CREATE TABLE IF NOT EXISTS technologies (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        stakeholder_id TEXT REFERENCES stakeholders(stakeholder_id),
        tech_category_id TEXT,
        tech_sub_category_id TEXT,
        description TEXT,
        ip_status TEXT,
        patent_number TEXT,
        ip_owner TEXT,
        licensing_availability TEXT,
        geographic_restrictions TEXT,
        disclosure_level TEXT,
        trl_level INTEGER,
        image_url TEXT
      );
    `);

        await query(`
      CREATE TABLE IF NOT EXISTS tech_needs (
        id TEXT PRIMARY KEY,
        seeker_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        industry TEXT,
        budget_range TEXT,
        deadline TEXT,
        status TEXT,
        created_at BIGINT
      );
    `);

        await query(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id TEXT PRIMARY KEY,
        provider_id TEXT,
        title TEXT NOT NULL,
        subtitle TEXT,
        date TEXT,
        description TEXT,
        type TEXT,
        image_url TEXT,
        link TEXT
      );
    `);

        console.log('✅ Tables created successfully.');

        // 2. Load and Seed Data
        if (fs.existsSync(DATA_FILE)) {
            console.log('📂 Loading data from data.json...');
            const rawData = fs.readFileSync(DATA_FILE, 'utf8');
            const data = JSON.parse(rawData);

            // Seed Stakeholders
            if (data.stakeholders) {
                console.log(`🌱 Seeding ${data.stakeholders.length} stakeholders...`);
                for (const s of data.stakeholders) {
                    await query(`
            INSERT INTO stakeholders (
              stakeholder_id, name, category, description, legal_address, 
              legal_document_id, website, contact_name, contact_email, 
              phone, whatsapp_enabled, is_verified, key_tech_areas, roles, investor_info
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (stakeholder_id) DO NOTHING
          `, [
                        s.stakeholder_id, s.name, s.category, s.description, s.legal_address,
                        s.legal_document_id, s.website, s.contact_name, s.contact_email,
                        s.phone, s.whatsapp_enabled || false, s.is_verified || false,
                        JSON.stringify(s.key_tech_areas || []), JSON.stringify(s.roles || []),
                        s.investor_info ? JSON.stringify(s.investor_info) : null
                    ]);
                }
            }

            // Seed Users
            if (data.users) {
                console.log(`🌱 Seeding ${data.users.length} users...`);
                for (const u of data.users) {
                    await query(`
            INSERT INTO users (
              id, name, email, password, scenario, stakeholder_id, 
              is_verified, is_email_verified, is_id_verified, 
              verification_status, is_admin, joined_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (email) DO NOTHING
          `, [
                        u.id, u.name, u.email, u.password, u.scenario, u.stakeholder_id,
                        u.is_verified || false, u.is_email_verified || false, u.is_id_verified || false,
                        u.verification_status, u.isAdmin || false, u.joinedDate
                    ]);
                }
            }

            // Seed Technologies
            if (data.technologies) {
                console.log(`🌱 Seeding ${data.technologies.length} technologies...`);
                for (const t of data.technologies) {
                    await query(`
            INSERT INTO technologies (
              id, name, stakeholder_id, tech_category_id, tech_sub_category_id, 
              description, ip_status, patent_number, ip_owner, 
              licensing_availability, geographic_restrictions, 
              disclosure_level, trl_level, image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (id) DO NOTHING
          `, [
                        t.id, t.name, t.stakeholder_id, t.tech_category_id, t.tech_sub_category_id,
                        t.description, t.ip_status, t.patent_number, t.ip_owner,
                        t.licensing_availability, t.geographic_restrictions,
                        t.disclosure_level, t.trl_level, t.imageUrl
                    ]);
                }
            }

            // Seed Needs
            if (data.tech_needs) {
                console.log(`🌱 Seeding ${data.tech_needs.length} tech needs...`);
                for (const n of data.tech_needs) {
                    await query(`
            INSERT INTO tech_needs (
              id, seeker_id, title, description, industry, 
              budget_range, deadline, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING
          `, [
                        n.id, n.seeker_id, n.title, n.description, n.industry,
                        n.budget_range, n.deadline, n.status, n.createdAt
                    ]);
                }
            }

            // Seed Opportunities
            if (data.opportunities) {
                console.log(`🌱 Seeding ${data.opportunities.length} opportunities...`);
                for (const o of data.opportunities) {
                    await query(`
            INSERT INTO opportunities (
              id, provider_id, title, subtitle, date, 
              description, type, image_url, link
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING
          `, [
                        o.id, o.provider_id, o.title, o.subtitle, o.date,
                        o.description, o.type, o.imageUrl, o.link
                    ]);
                }
            }

            console.log('✅ Data seeding completed.');
        } else {
            console.log('⚠️ No data.json found, skipping seeding.');
        }

        console.log('🎊 Migration finished successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
