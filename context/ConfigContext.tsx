
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ConfigContextType {
  techCategories: string[];
  industries: string[];
  fundingTypes: string[];
  ipStatusTypes: string[];
  geographicRestrictions: string[];
  disclosureLevels: string[];
  licensingAvailabilities: string[];
  opportunityTypes: string[];
  stakeholderCategories: string[];

  addItem: (listKey: string, name: string) => void;
  removeItem: (listKey: string, name: string) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [techCategories, setTechCategories] = useState<string[]>(['Energy', 'Agriculture', 'Materials', 'Digital Economy', 'Biotechnology', 'Water Management', 'CleanTech', 'Healthcare']);
  const [industries, setIndustries] = useState<string[]>(['Energy', 'Water / Environment', 'Agriculture', 'Information Technology', 'Healthcare', 'Manufacturing', 'Logistics']);
  const [fundingTypes, setFundingTypes] = useState<string[]>(['Equity', 'Convertible Notes', 'Venture Debt', 'Grants', 'Crowdfunding']);
  const [ipStatusTypes, setIpStatusTypes] = useState<string[]>(['patented', 'filed', 'know-how', 'open']);
  const [geographicRestrictions, setGeographicRestrictions] = useState<string[]>(['global', 'selected countries', 'region-limited']);
  const [disclosureLevels, setDisclosureLevels] = useState<string[]>(['public', 'limited', 'confidential']);
  const [licensingAvailabilities, setLicensingAvailabilities] = useState<string[]>(['yes', 'no', 'negotiable']);
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>(['Event', 'Tour', 'Service', 'Support']);
  const [stakeholderCategories, setStakeholderCategories] = useState<string[]>([
    'Research and academic institution',
    'Intergovernmental organisation',
    'Non-governmental organisation',
    'Public sector organisation',
    'Specialized agency',
    'Initiative',
    'Not for profit organisation',
    'Regional organisation',
    'Private sector organisation',
    'Local government',
    'Government/Ministry',
    'Financial institution',
    'Partnership',
    'Other'
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('apctt_config_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.techCategories) setTechCategories(parsed.techCategories);
      if (parsed.industries) setIndustries(parsed.industries);
      if (parsed.fundingTypes) setFundingTypes(parsed.fundingTypes);
      if (parsed.ipStatusTypes) setIpStatusTypes(parsed.ipStatusTypes);
      if (parsed.geographicRestrictions) setGeographicRestrictions(parsed.geographicRestrictions);
      if (parsed.disclosureLevels) setDisclosureLevels(parsed.disclosureLevels);
      if (parsed.licensingAvailabilities) setLicensingAvailabilities(parsed.licensingAvailabilities);
      if (parsed.opportunityTypes) setOpportunityTypes(parsed.opportunityTypes);
      if (parsed.stakeholderCategories) setStakeholderCategories(parsed.stakeholderCategories);
    }
  }, []);

  const saveToLocal = (updated: any) => {
    const current = JSON.parse(localStorage.getItem('apctt_config_v3') || '{}');
    const newState = { ...current, ...updated };
    localStorage.setItem('apctt_config_v3', JSON.stringify(newState));
  };

  const addItem = (listKey: string, name: string) => {
    let updatedList: string[] = [];
    switch (listKey) {
      case 'category': updatedList = [...techCategories, name]; setTechCategories(updatedList); saveToLocal({ techCategories: updatedList }); break;
      case 'industry': updatedList = [...industries, name]; setIndustries(updatedList); saveToLocal({ industries: updatedList }); break;
      case 'funding': updatedList = [...fundingTypes, name]; setFundingTypes(updatedList); saveToLocal({ fundingTypes: updatedList }); break;
      case 'ip': updatedList = [...ipStatusTypes, name]; setIpStatusTypes(updatedList); saveToLocal({ ipStatusTypes: updatedList }); break;
      case 'geo': updatedList = [...geographicRestrictions, name]; setGeographicRestrictions(updatedList); saveToLocal({ geographicRestrictions: updatedList }); break;
      case 'disclosure': updatedList = [...disclosureLevels, name]; setDisclosureLevels(updatedList); saveToLocal({ disclosureLevels: updatedList }); break;
      case 'licensing': updatedList = [...licensingAvailabilities, name]; setLicensingAvailabilities(updatedList); saveToLocal({ licensingAvailabilities: updatedList }); break;
      case 'opportunity': updatedList = [...opportunityTypes, name]; setOpportunityTypes(updatedList); saveToLocal({ opportunityTypes: updatedList }); break;
      case 'stakeholder': updatedList = [...stakeholderCategories, name]; setStakeholderCategories(updatedList); saveToLocal({ stakeholderCategories: updatedList }); break;
    }
  };

  const removeItem = (listKey: string, name: string) => {
    let updatedList: string[] = [];
    switch (listKey) {
      case 'category': updatedList = techCategories.filter(c => c !== name); setTechCategories(updatedList); saveToLocal({ techCategories: updatedList }); break;
      case 'industry': updatedList = industries.filter(c => c !== name); setIndustries(updatedList); saveToLocal({ industries: updatedList }); break;
      case 'funding': updatedList = fundingTypes.filter(c => c !== name); setFundingTypes(updatedList); saveToLocal({ fundingTypes: updatedList }); break;
      case 'ip': updatedList = ipStatusTypes.filter(c => c !== name); setIpStatusTypes(updatedList); saveToLocal({ ipStatusTypes: updatedList }); break;
      case 'geo': updatedList = geographicRestrictions.filter(c => c !== name); setGeographicRestrictions(updatedList); saveToLocal({ geographicRestrictions: updatedList }); break;
      case 'disclosure': updatedList = disclosureLevels.filter(c => c !== name); setDisclosureLevels(updatedList); saveToLocal({ disclosureLevels: updatedList }); break;
      case 'licensing': updatedList = licensingAvailabilities.filter(c => c !== name); setLicensingAvailabilities(updatedList); saveToLocal({ licensingAvailabilities: updatedList }); break;
      case 'opportunity': updatedList = opportunityTypes.filter(c => c !== name); setOpportunityTypes(updatedList); saveToLocal({ opportunityTypes: updatedList }); break;
      case 'stakeholder': updatedList = stakeholderCategories.filter(c => c !== name); setStakeholderCategories(updatedList); saveToLocal({ stakeholderCategories: updatedList }); break;
    }
  };

  return (
    <ConfigContext.Provider value={{
      techCategories, industries, fundingTypes, ipStatusTypes, geographicRestrictions, disclosureLevels, licensingAvailabilities, opportunityTypes, stakeholderCategories,
      addItem, removeItem
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
};
