import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { OpportunityProvider } from './context/OpportunityContext';
import { ConfigProvider } from './context/ConfigContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import About from './pages/About';
import Technologies from './pages/Technologies';
import TechnologyDetail from './pages/TechnologyDetail';
import NeedsDirectory from './pages/NeedsDirectory';
import NeedDetail from './pages/NeedDetail';
import Stakeholders from './pages/Stakeholders';
import StakeholderDetail from './pages/StakeholderDetail';
import Opportunities from './pages/Opportunities';
import OpportunityDetail from './pages/OpportunityDetail';
import KnowledgeBase from './pages/KnowledgeBase';
import Matchmaker from './pages/Matchmaker';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RegisterTechnology from './pages/RegisterTechnology';
import RegisterNeed from './pages/RegisterNeed';
import RegisterOpportunity from './pages/RegisterOpportunity';
import ChatRoomPage from './pages/ChatRoomPage';
import AdminDashboard from './pages/AdminDashboard';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ConfigProvider>
        <ChatProvider>
          <OpportunityProvider>
            <Router>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/technologies" element={<Technologies />} />
                    <Route path="/technologies/:id" element={<TechnologyDetail />} />
                    <Route path="/needs" element={<NeedsDirectory />} />
                    <Route path="/needs/:id" element={<NeedDetail />} />
                    <Route path="/stakeholders" element={<Stakeholders />} />
                    <Route path="/stakeholders/:id" element={<StakeholderDetail />} />
                    <Route path="/opportunities" element={<Opportunities />} />
                    <Route path="/opportunities/:id" element={<OpportunityDetail />} />
                    <Route path="/knowledge" element={<KnowledgeBase />} />
                    <Route path="/matchmaker" element={<Matchmaker />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/register-tech" element={<RegisterTechnology />} />
                    <Route path="/register-need" element={<RegisterNeed />} />
                    <Route path="/register-opportunity" element={<RegisterOpportunity />} />
                    <Route path="/chat/:chatId" element={<ChatRoomPage />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
                  <div className="max-w-7xl mx-auto px-4 text-center sm:text-left sm:flex sm:justify-between items-center">
                    <div className="mb-6 sm:mb-0">
                      <h2 className="text-white font-bold text-xl mb-2">APCTT TechTransfer Connect</h2>
                      <p className="text-sm text-slate-500 mb-1">© 2024 Asia-Pacific Centre for Transfer of Technologies.</p>
                      <p className="text-xs text-slate-600">Developed in strategic partnership with <span className="text-slate-500 font-bold">RH ISTC</span>.</p>
                    </div>
                    <ul className="flex justify-center sm:justify-end space-x-6 text-sm">
                      <li>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                      </li>
                      <li>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                      </li>
                      <li>
                        <a href="https://apctt.org/contact-us" className="hover:text-white transition-colors">Contact Us</a>
                      </li>
                    </ul>
                  </div>
                </footer>
              </div>
            </Router>
          </OpportunityProvider>
        </ChatProvider>
      </ConfigProvider>
    </AuthProvider>
  );
};

export default App;
