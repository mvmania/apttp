import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Helper function to read data
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return { stakeholders: [], users: [], technologies: [], tech_needs: [], opportunities: [], knowledge_base: [] };
    }
};

// Helper function to write data
const writeData = (data: any) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing data file:', error);
    }
};

// GET all data
app.get('/api/data', (req: Request, res: Response) => {
    const data = readData();
    res.json(data);
});

// GET stakeholders
app.get('/api/stakeholders', (req: Request, res: Response) => {
    const data = readData();
    res.json(data.stakeholders || []);
});

// GET technologies
app.get('/api/technologies', (req: Request, res: Response) => {
    const data = readData();
    res.json(data.technologies || []);
});

// POST technology
app.post('/api/technologies', (req: Request, res: Response) => {
    const data = readData();
    const newTech = {
        ...req.body,
        id: `t${Date.now()}`
    };
    data.technologies = [...(data.technologies || []), newTech];
    writeData(data);
    res.status(201).json(newTech);
});

// GET tech needs
app.get('/api/tech-needs', (req: Request, res: Response) => {
    const data = readData();
    res.json(data.tech_needs || []);
});

// POST tech need
app.post('/api/tech-needs', (req: Request, res: Response) => {
    const data = readData();
    const newNeed = {
        ...req.body,
        id: `n${Date.now()}`,
        createdAt: Date.now()
    };
    data.tech_needs = [...(data.tech_needs || []), newNeed];
    writeData(data);
    res.status(201).json(newNeed);
});

// GET opportunities
app.get('/api/opportunities', (req: Request, res: Response) => {
    const data = readData();
    res.json(data.opportunities || []);
});

// POST opportunity
app.post('/api/opportunities', (req: Request, res: Response) => {
    const data = readData();
    const newOpp = {
        ...req.body,
        id: `o${Date.now()}`
    };
    data.opportunities = [...(data.opportunities || []), newOpp];
    writeData(data);
    res.status(201).json(newOpp);
});

// GET users
app.get('/api/users', (req: Request, res: Response) => {
    const data = readData();
    res.json(data.users || []);
});

// POST register
app.post('/api/register', (req: Request, res: Response) => {
    const data = readData();
    const { name, email, password, scenario, orgName, orgCategory, orgWebsite } = req.body;

    // Check if user already exists
    if (data.users.find((u: any) => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    let stakeholder_id = '';

    // If it's an org representative/member, we might need a stakeholder_id
    // For now, let's create a new stakeholder only for representatives if org info provided
    if ((scenario === 'Organization Representative' || scenario === 'Official Representative') && orgName) {
        stakeholder_id = `s${Date.now()}`;
        const newStakeholder = {
            stakeholder_id,
            name: orgName,
            category: orgCategory,
            website: orgWebsite,
            description: `Registered via platform by ${name}`,
            is_verified: false,
            key_tech_areas: [],
            roles: ['Provider']
        };
        data.stakeholders = [...(data.stakeholders || []), newStakeholder];
    }

    const newUser = {
        id: `u${Date.now()}`,
        name,
        email,
        password,
        scenario,
        stakeholder_id,
        is_verified: false,
        is_email_verified: false,
        is_id_verified: false,
        verification_status: 'None',
        joinedDate: Date.now()
    };

    data.users = [...(data.users || []), newUser];
    writeData(data);

    res.status(201).json(newUser);
});

// PUT user
app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = readData();
    const index = data.users.findIndex((u: any) => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });

    data.users[index] = { ...data.users[index], ...req.body };
    writeData(data);
    res.json(data.users[index]);
});

// DELETE user
app.delete('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = readData();
    const initialCount = data.users.length;
    data.users = data.users.filter((u: any) => u.id !== id);

    if (data.users.length === initialCount) {
        return res.status(404).json({ error: 'User not found' });
    }

    writeData(data);
    res.status(204).send();
});

// PUT stakeholder
app.put('/api/stakeholders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const data = readData();
    const index = data.stakeholders.findIndex((s: any) => s.stakeholder_id === id);
    if (index === -1) return res.status(404).json({ error: 'Stakeholder not found' });

    data.stakeholders[index] = { ...data.stakeholders[index], ...req.body };
    writeData(data);
    res.json(data.stakeholders[index]);
});

// GET search (simple search implementation)
app.get('/api/search', (req: Request, res: Response) => {
    const query = (req.query.q as string || '').toLowerCase();
    const data = readData();

    const results = [
        ...(data.technologies?.filter((t: any) => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)) || []),
        ...(data.stakeholders?.filter((s: any) => s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)) || [])
    ];

    res.json(results);
});

// Basic health check
app.get('/health', (req: Request, res: Response) => {
    res.send('Backend is running');
});

// Serve static files from the dist directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Final catch-all middleware for SPA routing
// This replaces the problematic app.get wildcard route for Express 5 compatibility
app.use((req: Request, res: Response) => {
    // If it's an API request that reached here, it's a 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    // Otherwise, serve the frontend index.html for SPA routing
    res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
    console.log(`Serving static files from: ${distPath}`);
});
