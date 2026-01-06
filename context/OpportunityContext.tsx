
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Opportunity } from '../types';
import { apiService } from '../services/apiService';

interface OpportunityContextType {
  opportunities: Opportunity[];
  addOpportunity: (opportunity: Omit<Opportunity, 'id'>) => void;
  getOpportunitiesByStakeholder: (stakeholderId: string) => Opportunity[];
  loading: boolean;
}

const OpportunityContext = createContext<OpportunityContextType | undefined>(undefined);

export const OpportunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const data = await apiService.getOpportunities();
        setOpportunities(data);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const addOpportunity = async (opData: Omit<Opportunity, 'id'>) => {
    try {
      const newOp = await apiService.registerOpportunity(opData);
      setOpportunities([newOp, ...opportunities]);
    } catch (error) {
      console.error('Error adding opportunity:', error);
    }
  };

  const getOpportunitiesByStakeholder = (stakeholderId: string) => {
    return opportunities.filter(op => op.stakeholder_id === stakeholderId);
  };

  return (
    <OpportunityContext.Provider value={{ opportunities, addOpportunity, getOpportunitiesByStakeholder }}>
      {children}
    </OpportunityContext.Provider>
  );
};

export const useOpportunities = () => {
  const context = useContext(OpportunityContext);
  if (!context) throw new Error('useOpportunities must be used within OpportunityProvider');
  return context;
};
