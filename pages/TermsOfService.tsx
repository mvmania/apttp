import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4">
            <div className="max-w-3xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
                <Link to="/" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-apctt-blue mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </Link>
                <h1 className="text-3xl font-black text-slate-900 mb-6">Terms of Service</h1>
                <div className="prose prose-slate">
                    <p>Last updated: January 2026</p>
                    <p>
                        Welcome to APCTT TechTransfer Connect. By accessing our platform, you agree to these terms...
                        (This is a placeholder for the actual legal text).
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
