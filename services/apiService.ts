const API_URL = 'http://localhost:10000/api';

const getAccessToken = (): string => localStorage.getItem('apctt_access_token') || '';

const getAuthHeaders = (): Record<string, string> => {
    const token = getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    try {
        const payload = await response.json();
        return payload?.error || fallback;
    } catch {
        return fallback;
    }
};

export const apiService = {
    async loginUser(email: string, password: string, captchaToken?: string) {
        const payload: Record<string, string> = { email, password };
        if (captchaToken) payload.captchaToken = captchaToken;

        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Login failed'));
        }
        return response.json();
    },

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
        const response = await fetch(`${API_URL}/users`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    async getPublicUsers() {
        const response = await fetch(`${API_URL}/users/public`);
        if (!response.ok) throw new Error('Failed to fetch public users');
        return response.json();
    },

    async search(query: string) {
        const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search');
        return response.json();
    },

    async getAllData() {
        const response = await fetch(`${API_URL}/data`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error('Failed to fetch all data');
        return response.json();
    },

    async registerTechnology(techData: any, turnstileToken?: string) {
        const payload = turnstileToken ? { ...techData, turnstileToken } : techData;
        const response = await fetch(`${API_URL}/technologies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to register technology'));
        return response.json();
    },

    async registerNeed(needData: any, turnstileToken?: string) {
        const payload = turnstileToken ? { ...needData, turnstileToken } : needData;
        const response = await fetch(`${API_URL}/tech-needs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to register need'));
        return response.json();
    },

    async registerOpportunity(oppData: any, turnstileToken?: string) {
        const payload = turnstileToken ? { ...oppData, turnstileToken } : oppData;
        const response = await fetch(`${API_URL}/opportunities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to register opportunity'));
        return response.json();
    },

    async registerUser(userData: any, turnstileToken?: string) {
        const payload = turnstileToken ? { ...userData, turnstileToken } : userData;
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to register'));
        }
        return response.json();
    },

    async resendVerificationEmail() {
        const response = await fetch(`${API_URL}/auth/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }
        });
        if (!response.ok) {
            throw new Error(await readErrorMessage(response, 'Failed to resend verification email'));
        }
        return response.json();
    },

    async updateUser(id: string, userData: any) {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to update user'));
        return response.json();
    },

    async updateStakeholder(id: string, stakeholderData: any) {
        const response = await fetch(`${API_URL}/stakeholders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(stakeholderData)
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to update stakeholder'));
        return response.json();
    },

    async deleteUser(id: string) {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to delete user'));
        return true;
    },

    async getContent() {
        const response = await fetch(`${API_URL}/content`);
        if (!response.ok) throw new Error('Failed to fetch content');
        return response.json();
    },

    async getAdminContent() {
        const response = await fetch(`${API_URL}/admin/content`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to fetch admin content'));
        return response.json();
    },

    async updateContent(key: string, content: string) {
        const response = await fetch(`${API_URL}/content/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to update content'));
        return response.json();
    },

    async getModerationQueue() {
        const response = await fetch(`${API_URL}/moderation/pending`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to fetch moderation queue'));
        return response.json();
    },

    async approveTechnology(id: string, note?: string) {
        const response = await fetch(`${API_URL}/moderation/technologies/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ note })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to approve technology'));
        return response.json();
    },

    async rejectTechnology(id: string, note?: string) {
        const response = await fetch(`${API_URL}/moderation/technologies/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ note })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to reject technology'));
        return response.json();
    },

    async approveStakeholder(id: string, note?: string) {
        const response = await fetch(`${API_URL}/moderation/stakeholders/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ note })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to approve stakeholder'));
        return response.json();
    },

    async rejectStakeholder(id: string, note?: string) {
        const response = await fetch(`${API_URL}/moderation/stakeholders/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ note })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to reject stakeholder'));
        return response.json();
    },

    async approveTechNeed(id: string, note?: string) {
        const response = await fetch(`${API_URL}/moderation/tech-needs/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ note })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to approve tech need'));
        return response.json();
    },

    async rejectTechNeed(id: string, note?: string) {
        const response = await fetch(`${API_URL}/moderation/tech-needs/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ note })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to reject tech need'));
        return response.json();
    },

    async getCoAdminScopes() {
        const response = await fetch(`${API_URL}/admin/co-admin-scopes`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to fetch co-admin scopes'));
        return response.json();
    },

    async assignCoAdmin(userId: string, countries: string[]) {
        const response = await fetch(`${API_URL}/admin/assign-co-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ userId, countries })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to assign co-admin'));
        return response.json();
    },

    async revokeCoAdmin(userId: string) {
        const response = await fetch(`${API_URL}/admin/revoke-co-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to revoke co-admin'));
        return response.json();
    },

    async createRoleRequest(requestedRole: 'co_admin' | 'admin', countries: string[] = []) {
        const response = await fetch(`${API_URL}/role-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ requestedRole, countries })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to create role request'));
        return response.json();
    },

    async getMyRoleRequests() {
        const response = await fetch(`${API_URL}/role-requests/mine`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to fetch your role requests'));
        return response.json();
    },

    async getPendingRoleRequests() {
        const response = await fetch(`${API_URL}/master-admin/role-requests`, {
            headers: { ...getAuthHeaders() }
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to fetch pending role requests'));
        return response.json();
    },

    async approveRoleRequest(id: string, note?: string) {
        const response = await fetch(`${API_URL}/master-admin/role-requests/${id}/approve`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ note })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to approve role request'));
        return response.json();
    },

    async rejectRoleRequest(id: string, note?: string) {
        const response = await fetch(`${API_URL}/master-admin/role-requests/${id}/reject`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ note })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to reject role request'));
        return response.json();
    },

    async transferMasterAdmin(newMasterUserId: string) {
        const response = await fetch(`${API_URL}/master-admin/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ newMasterUserId })
        });
        if (!response.ok) throw new Error(await readErrorMessage(response, 'Failed to transfer master admin role'));
        return response.json();
    }
};

