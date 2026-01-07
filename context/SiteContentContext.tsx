import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface SiteContentContextType {
    content: Record<string, string>;
    loading: boolean;
    refreshContent: () => Promise<void>;
    updateContent: (key: string, value: string) => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [content, setContent] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const fetchContent = async () => {
        try {
            const data = await apiService.getContent();
            setContent(data);
        } catch (error) {
            console.error('Failed to load site content:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const updateContent = async (key: string, value: string) => {
        try {
            await apiService.updateContent(key, value);
            await fetchContent(); // Refresh local state
        } catch (error) {
            console.error('Failed to update content:', error);
            throw error;
        }
    };

    return (
        <SiteContentContext.Provider value={{ content, loading, refreshContent: fetchContent, updateContent }}>
            {children}
        </SiteContentContext.Provider>
    );
};

export const useSiteContent = () => {
    const context = useContext(SiteContentContext);
    if (context === undefined) {
        throw new Error('useSiteContent must be used within a SiteContentProvider');
    }
    return context;
};
