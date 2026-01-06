
export const TRL_DEFINITIONS = [
    { level: 1, title: 'Basic principles observed', desc: 'Scientific research begins to be translated into applied research and development.' },
    { level: 2, title: 'Technology concept formulated', desc: 'Practical applications can be invented. Applications are speculative, and there may be no proof or detailed analysis to support the assumptions.' },
    { level: 3, title: 'Experimental proof of concept', desc: 'Active research and development is initiated. This includes analytical studies and laboratory studies to physically validate the analytical predictions.' },
    { level: 4, title: 'Technology validated in lab', desc: 'Basic technological components are integrated to establish that they will work together.' },
    { level: 5, title: 'Technology validated in relevant environment', desc: 'Reliability of technology innovation increases significantly. The basic technological components are integrated with reasonably realistic supporting elements.' },
    { level: 6, title: 'Technology demonstrated in relevant environment', desc: 'Prototyping system verified of technology innovation. A representative model or prototype system is tested in a relevant environment.' },
    { level: 7, title: 'System prototype demonstration in operational environment', desc: 'A system prototype is demonstrated in an operational environment.' },
    { level: 8, title: 'System complete and qualified', desc: 'The technology has been proven to work in its final form and under expected conditions.' },
    { level: 9, title: 'Actual system proven in operational environment', desc: 'The technology is in its final form and operated under the full range of operating mission conditions.' }
];

export const getTrlColor = (level: number) => {
    if (level >= 7) return 'bg-emerald-500';
    if (level >= 4) return 'bg-blue-500';
    return 'bg-amber-500';
};
