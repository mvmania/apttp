
import { Stakeholder, StakeholderCategory, Technology, Opportunity, KnowledgeItem, UserAccount, UserScenario, TechNeed, VerificationStatus } from './types';

export const STAKEHOLDERS: Stakeholder[] = [
  {
    stakeholder_id: 's1',
    name: 'Asia-Pacific Centre for Transfer of Technologies (APCTT)',
    category: StakeholderCategory.GOVERNMENT,
    description: 'A regional institute of the United Nations Economic and Social Commission for Asia and the Pacific (ESCAP). We facilitate regional cooperation and capacity building for technology transfer.',
    legal_address: 'New Delhi, India',
    legal_document_id: 'UN-ESCAP-001',
    website: 'https://apctt.org',
    contact_name: 'Director Office',
    contact_email: 'director.apctt@un.org',
    phone: '+91 9650853838',
    whatsapp_enabled: false,
    is_verified: true,
    key_tech_areas: ['Climate Tech', 'Smart Agriculture', 'Water Management', 'Green Energy'],
    roles: ['Provider', 'Seeker']
  },
  {
    stakeholder_id: 's2',
    name: 'GreenFuture Tech Inc.',
    category: StakeholderCategory.PRIVATE_COMPANY,
    description: 'Leading provider of solar and wind energy harvesting solutions with a focus on high-efficiency perovskite cells.',
    legal_address: 'Singapore Science Park II',
    legal_document_id: 'SG-REG-9921',
    website: 'https://greenfuture.example.com',
    contact_name: 'John Chen',
    contact_email: 'j.chen@greenfuture.com',
    phone: '+91 9650853838',
    whatsapp_enabled: true,
    is_verified: true,
    key_tech_areas: ['Solar PV', 'Wind Turbines', 'Battery Storage', 'Energy Efficiency'],
    roles: ['Provider']
  },
  {
    stakeholder_id: 's3',
    name: 'Nexus Ventures Asia',
    category: StakeholderCategory.INVESTOR,
    description: 'A venture capital firm dedicated to scaling deep-tech innovations that address climate change and food security in the APAC region.',
    legal_address: 'Tokyo, Japan',
    legal_document_id: 'JP-VC-4412',
    website: 'https://nexus-ventures.example.com',
    contact_name: 'Sarah Sato',
    contact_email: 'invest@nexusasia.com',
    whatsapp_enabled: false,
    is_verified: true,
    key_tech_areas: ['Agri-Tech', 'Renewable Energy', 'Clean Water', 'Circular Economy'],
    roles: ['Investor'],
    investor_info: {
      funding_types: ['Equity', 'Convertible Notes', 'Venture Debt'],
      investment_range: '$500k - $5M',
      preferred_trl_min: 5,
      typical_deal_cycle: '3-6 Months'
    }
  }
];

export const DEMO_USERS: UserAccount[] = [
  {
    id: 'admin',
    name: 'APCTT Platform Admin',
    email: 'admin@apctt.org',
    scenario: UserScenario.PLATFORM_ADMIN,
    stakeholder_id: 's1',
    is_verified: true,
    is_email_verified: true,
    is_id_verified: true,
    verification_status: VerificationStatus.APPROVED,
    isAdmin: true, 
    joinedDate: 1704067200000 
  },
  {
    id: 'u1',
    name: 'John Chen',
    email: 'j.chen@greenfuture.com',
    scenario: UserScenario.ORG_REPRESENTATIVE,
    stakeholder_id: 's2',
    is_verified: true,
    is_email_verified: true,
    is_id_verified: true,
    verification_status: VerificationStatus.APPROVED,
    is_primary_rep: true,
    joinedDate: 1704067200000 
  },
  {
    id: 'u2',
    name: 'Emily Wong',
    email: 'e.wong@greenfuture.com',
    scenario: UserScenario.ORG_MEMBER,
    stakeholder_id: 's2',
    is_verified: true,
    is_email_verified: true,
    is_id_verified: false,
    verification_status: VerificationStatus.NONE,
    joinedDate: 1706745600000
  },
  {
    id: 'u4',
    name: 'David Kim',
    email: 'd.kim@greenfuture.com',
    scenario: UserScenario.ORG_MEMBER,
    stakeholder_id: 's2',
    is_verified: false,
    is_email_verified: false,
    is_id_verified: false,
    verification_status: VerificationStatus.NONE,
    joinedDate: 1712128000000
  },
  {
    id: 'u3',
    name: 'Independent Innovator',
    email: 'innovator@personal.com',
    scenario: UserScenario.INDIVIDUAL,
    is_verified: false,
    is_email_verified: true,
    is_id_verified: false,
    verification_status: VerificationStatus.NONE,
    joinedDate: 1714547200000
  }
];

export const TECHNOLOGIES: Technology[] = [
  {
    id: 't1',
    name: 'Smart Irrigation AI',
    stakeholder_id: 's1',
    tech_category_id: 'Agriculture',
    tech_sub_category_id: 'Automation',
    description: 'An AI-powered system that optimizes water usage in agriculture using soil moisture sensors and weather forecasting.',
    ip_status: 'patented',
    patent_number: 'US11000000B2',
    ip_owner: 'Pacific University of Technology',
    licensing_availability: 'yes',
    geographic_restrictions: 'region-limited',
    disclosure_level: 'public',
    trl_level: 7,
    imageUrl: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=1200',
    videoUrl: 'https://www.youtube.com/embed/S_S_S_S_S_S'
  },
  {
    id: 't2',
    name: 'Ultra-Thin Perovskite Solar Cells',
    stakeholder_id: 's2',
    tech_category_id: 'Energy',
    tech_sub_category_id: 'Solar',
    description: 'High-efficiency solar cells that can be applied to flexible surfaces, increasing the range of solar energy applications.',
    ip_status: 'filed',
    ip_owner: 'GreenFuture Tech Inc.',
    licensing_availability: 'negotiable',
    geographic_restrictions: 'global',
    disclosure_level: 'limited',
    trl_level: 5,
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=80&w=1200',
  }
];

export const TECH_NEEDS: TechNeed[] = [
  {
    id: 'n1',
    seeker_id: 'u3',
    title: 'Low-cost water filtration for rural SE Asia',
    description: 'We are looking for a decentralized water purification technology that does not require constant electricity and costs under $50 per unit.',
    industry: 'Water / Environment',
    budget_range: '$10k - $50k',
    deadline: '2024-12-31',
    status: 'open',
    createdAt: Date.now() - 864000000
  }
];

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: 'o1',
    type: 'Event',
    title: 'Regional Tech Transfer Forum 2024',
    description: 'A gathering of 500+ innovators and investors across the Asia-Pacific region to discuss the future of regional collaboration and technological advancement.',
    stakeholder_id: 's1',
    date: '2024-11-15',
    imageUrl: 'https://images.unsplash.com/photo-1540575861501-7ad05823c9f5?auto=format&fit=crop&q=80&w=1200'
  }
];

export const KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'k1',
    title: 'Navigating Cross-Border Tech Licensing',
    summary: 'A comprehensive guide on legal frameworks for technology transfer between ASEAN countries.',
    category: 'Legal',
    url: '#',
  }
];
