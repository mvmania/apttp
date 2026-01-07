import React from 'react';
import { Info, Target, Users, Zap, Globe } from 'lucide-react';

import { useSiteContent } from '../context/SiteContentContext';

const About: React.FC = () => {
  const { content } = useSiteContent();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <header className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">About the Platform</h1>
        <p className="text-xl text-slate-600 leading-relaxed">
          Bridging the gap between innovation and implementation across the Asia-Pacific region.
        </p>
      </header>

      <section className="mb-16">
        <div className="bg-blue-600 text-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Info className="mr-2" /> Asia-Pacific Centre for Transfer of Technologies (APCTT)
          </h2>
          <p className="mb-6 opacity-90 leading-relaxed">
            APCTT is a regional institution of the United Nations Economic and Social Commission for Asia and the Pacific (ESCAP) servicing the Asia-Pacific region. Our focus is on institutional capacity-building for the management of the innovation chain, including technology transfer and adoption of new technologies.
          </p>
          <a
            href="https://apctt.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Visit Official Website
          </a>
        </div>
      </section>

      <section className="mb-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-slate-900">
              <Globe className="mr-2 text-red-600" /> Russian House of International Scientific and Technical Cooperation (RH ISTC)
            </h2>
            <p
              className="mb-6 text-slate-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content['about_rh_istc_desc'] || 'The RH ISTC is a premier institution dedicated to fostering international scientific collaboration and technology transfer. Partnering with APCTT, the RH ISTC plays a pivotal role in connecting Russian technologies and scientific expertise with the Asia-Pacific region, driving innovation and sustainable development through cross-border cooperation.' }}
            />
            <div className="flex gap-4">
              <span className="inline-flex items-center text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Strategic Partner
              </span>
              <span className="inline-flex items-center text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                Co-Developer
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <Target className="w-10 h-10 text-blue-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">Our Mission</h3>
          <p className="text-slate-600 text-sm">To facilitate technology transfer and partnership building for sustainable development in Asia and the Pacific.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <Users className="w-10 h-10 text-green-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">Connect Stakeholders</h3>
          <p className="text-slate-600 text-sm">We bring together technology providers, seekers, and investors under one digital roof.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <Zap className="w-10 h-10 text-yellow-500 mb-4" />
          <h3 className="text-lg font-bold mb-2">Drive Innovation</h3>
          <p className="text-slate-600 text-sm">Empowering regional economies through smart matchmaking and knowledge dissemination.</p>
        </div>
      </div>
    </div >
  );
};

export default About;
