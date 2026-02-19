const API_URL = 'http://localhost:10000/api';


export const apiService = {
    async getStakeholders() {
        const response = await fetch(`${API_URL}/stakeholders`);
        if (!response.ok) throw new Error('Failed to fetch stakeholders');
        return response.json();
    },

    async getTechnologies() {
        const response = await fetch(`${API_URL}/technologies`);
        if (!response.ok) throw new Error('Failed to fetch technologies');
        return response.json();
    },

    async getTechNeeds() {
        const response = await fetch(`${API_URL}/tech-needs`);
        if (!response.ok) throw new Error('Failed to fetch tech needs');
        return response.json();
    },

    async getOpportunities() {
        const response = await fetch(`${API_URL}/opportunities`);
        if (!response.ok) throw new Error('Failed to fetch opportunities');
        return response.json();
    },

    async getUsers() {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    async search(query: string) {
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search');
        return response.json();
    },

    async getAllData() {
        const response = await fetch(`${API_URL}/data`);
        if (!response.ok) throw new Error('Failed to fetch all data');
        return response.json();
    },

    async registerTechnology(techData: any) {
        const response = await fetch(`${API_URL}/technologies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(techData)
        });
        if (!response.ok) throw new Error('Failed to register technology');
        return response.json();
    },

    async registerNeed(needData: any) {
        const response = await fetch(`${API_URL}/tech-needs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(needData)
        });
        if (!response.ok) throw new Error('Failed to register need');
        return response.json();
    },

    async registerOpportunity(oppData: any) {
        const response = await fetch(`${API_URL}/opportunities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(oppData)
        });
        if (!response.ok) throw new Error('Failed to register opportunity');
        return response.json();
    },

    async registerUser(userData: any) {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to register');
        }
        return response.json();
    },

    async updateUser(id: string, userData: any) {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to update user');
        return response.json();
    },

    async updateStakeholder(id: string, stakeholderData: any) {
        const response = await fetch(`${API_URL}/stakeholders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stakeholderData)
        });
        if (!response.ok) throw new Error('Failed to update stakeholder');
        return response.json();
    },

    async deleteUser(id: string) {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete user');
        return true;
    },

    async getContent() {
        const response = await fetch(`${API_URL}/content`);
        if (!response.ok) throw new Error('Failed to fetch content');
        return response.json();
    },

    async getAdminContent() {
        const response = await fetch(`${API_URL}/admin/content`);
        if (!response.ok) throw new Error('Failed to fetch admin content');
        return response.json();
    },

    async updateContent(key: string, content: string) {
        const response = await fetch(`${API_URL}/content/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Failed to update content');
        return response.json();
    }
};

