import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';

const Footer: React.FC = () => {
    const { content } = useSiteContent();

    return (
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 text-center sm:text-left sm:flex sm:justify-between items-center">
                <div className="mb-6 sm:mb-0">
                    <h2 className="text-white font-bold text-xl mb-2">APCTT TechTransfer Connect</h2>
                    <p
                        className="text-sm text-slate-500 mb-1"
                        dangerouslySetInnerHTML={{ __html: content['footer_copyright'] || '© 2024 Asia-Pacific Centre for Transfer of Technologies.' }}
                    />
                    <p
                        className="text-xs text-slate-600"
                        dangerouslySetInnerHTML={{
                            __html: content['footer_developed_by'] || 'Developed in strategic partnership with <span class="text-slate-500 font-bold">RH ISTC</span>.'
                        }}
                    />
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
    );
};

export default Footer;
