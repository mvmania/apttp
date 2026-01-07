
import React from 'react';
import { RotateCcw, ChevronRight, Check, ChevronDown } from 'lucide-react';

interface SidebarFilterProps {
    onReset: () => void;
    activeCount?: number;
    children: React.ReactNode;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({ onReset, activeCount = 0, children }) => {
    return (
        <div className="w-full lg:w-80 flex-shrink-0 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm h-fit sticky top-24">
            <div className="flex border-b border-slate-100">
                <button className="flex-1 py-4 px-6 text-sm font-black text-apctt-dark border-b-2 border-apctt-blue flex items-center justify-center gap-2">
                    Filters
                    {activeCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                            {activeCount}
                        </span>
                    )}
                </button>
            </div>

            <div className="p-8 space-y-8">
                <div className="flex justify-end">
                    <button
                        onClick={onReset}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 hover:text-apctt-blue transition-colors group"
                    >
                        <RotateCcw size={12} className="group-hover:rotate-[-45deg] transition-transform" />
                        Reset
                    </button>
                </div>

                {children}
            </div>
        </div>
    );
};

interface FilterSectionProps {
    label: string;
    badge?: string;
    children: React.ReactNode;
}

export const FilterSection: React.FC<FilterSectionProps> = ({ label, badge, children }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    {label}
                </label>
                {badge && (
                    <span className="text-[8px] font-black bg-apctt-blue text-white px-2 py-0.5 rounded-full uppercase tracking-tighter animate-bounce">
                        {badge}
                    </span>
                )}
            </div>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );
};

interface FilterChipProps {
    label: string;
    selected: boolean;
    onClick: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 rounded-xl border text-[11px] font-bold transition-all duration-300 whitespace-nowrap ${selected
                ? 'bg-apctt-light border-apctt-blue text-apctt-blue shadow-lg shadow-apctt-blue/5'
                : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-300'
                }`}
        >
            {label}
        </button>
    );
};

interface FilterCheckboxProps {
    label: string;
    checked: boolean;
    onChange: () => void;
}

export const FilterCheckbox: React.FC<FilterCheckboxProps> = ({ label, checked, onChange }) => {
    return (
        <label className="flex items-center gap-3 cursor-pointer group py-1">
            <div
                onClick={(e) => {
                    e.preventDefault();
                    onChange();
                }}
                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${checked
                    ? 'bg-apctt-blue border-apctt-blue'
                    : 'bg-white border-slate-200 group-hover:border-slate-300'
                    }`}
            >
                {checked && <Check size={12} className="text-white stroke-[4]" />}
            </div>
            <span className={`text-xs font-bold transition-colors ${checked ? 'text-apctt-blue' : 'text-slate-600 group-hover:text-slate-900'}`}>
                {label}
            </span>
        </label>
    );
};

interface FilterDropdownProps {
    label: string;
    options: string[];
    selected: string[];
    onChange: (value: string) => void;
    placeholder?: string;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({ label, options, selected, onChange, placeholder = "Select options..." }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="space-y-2" ref={dropdownRef}>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-3">
                {label}
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:border-slate-300 transition-all text-xs font-bold ${selected.length > 0 ? 'text-apctt-blue border-apctt-blue/30 bg-apctt-light/30' : 'text-slate-500'}`}
                >
                    <span className="truncate">
                        {selected.length === 0 ? placeholder :
                            selected.length === 1 ? selected[0] :
                                `${selected.length} Selected`}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => onChange(option)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors group ${selected.includes(option) ? 'bg-apctt-light text-apctt-blue' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {option}
                                {selected.includes(option) && <Check size={12} className="stroke-[3]" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Chips below dropdown for quick removal */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                    {selected.map(val => (
                        <span key={val} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-bold border border-slate-200">
                            {val}
                            <button onClick={() => onChange(val)} className="hover:text-red-500">
                                <RotateCcw size={8} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
