'use client';

import React, { useState, useEffect } from 'react';
import { Check, Trash2, Plus, Sparkles, Loader2, Briefcase, Tent, Plane, Stethoscope, BookOpen, Package } from 'lucide-react';
import { ChecklistItem } from '@/types';
import { generateChecklist } from '@/services/geminiService';
import { useLanguage } from '@/contexts/LanguageContext';

const Checklist: React.FC = () => {
  const { t, aiLanguage } = useLanguage();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('study-abroad-checklist');
    if (saved) {
      setItems(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('study-abroad-checklist', JSON.stringify(items));
  }, [items]);

  const handleAIGenerate = async () => {
    if (!destination || !duration) return;
    setLoading(true);
    const newItems = await generateChecklist(destination, duration, aiLanguage);
    const merged = [...items, ...newItems];
    setItems(merged);
    setLoading(false);
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    setItems([...items, {
      id: Date.now().toString(),
      category: 'Packing',
      text: newItemText,
      checked: false
    }]);
    setNewItemText('');
  };

  const categories = Array.from(new Set(items.map(i => i.category))) as string[];
  const progress = items.length > 0 ? Math.round((items.filter(i => i.checked).length / items.length) * 100) : 0;

  const getCategoryIcon = (cat: string) => {
     const c = cat.toLowerCase();
     if (c.includes('document')) return <Briefcase size={18} />;
     if (c.includes('health')) return <Stethoscope size={18} />;
     if (c.includes('money')) return <Briefcase size={18} />;
     if (c.includes('study')) return <BookOpen size={18} />;
     if (c.includes('travel') || c.includes('flight')) return <Plane size={18} />;
     return <Package size={18} />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header & Generator */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full -mr-10 -mt-10 opacity-50 blur-3xl"></div>

        <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-teal-100 p-3 rounded-2xl text-teal-600">
                    <Sparkles size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 font-heading">{t("Smart Packing List", "스마트 패킹 리스트")}</h2>
                    <p className="text-slate-500 font-medium">{t("AI suggests items based on local weather & culture.", "현지 날씨와 문화를 고려해 AI가 준비물을 추천합니다.")}</p>
                </div>
            </div>

            <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-2">
                <input
                    type="text"
                    placeholder={t("Where? (e.g. London)", "어디로 가시나요? (예: 런던)")}
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="flex-1 px-5 py-4 bg-white rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none font-bold text-slate-800 placeholder:text-slate-400"
                />
                <input
                    type="text"
                    placeholder={t("How long? (e.g. 4 weeks)", "얼마나? (예: 4주)")}
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full md:w-48 px-5 py-4 bg-white rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none font-bold text-slate-800 placeholder:text-slate-400"
                />
                <button
                    onClick={handleAIGenerate}
                    disabled={loading || !destination}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 whitespace-nowrap"
                >
                    {loading ? <Loader2 className="animate-spin"/> : <Sparkles size={20} />}
                    <span>{t("Generate", "리스트 생성")}</span>
                </button>
            </div>
        </div>
      </div>

      {/* Progress & Add Manual */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5 flex-1">
             <div className="flex-1">
                 <div className="flex justify-between items-end mb-2">
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("Progress", "준비 완료율")}</span>
                     <span className="text-2xl font-black text-teal-600">{progress}%</span>
                 </div>
                 <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-teal-500 transition-all duration-1000 ease-out rounded-full" style={{ width: `${progress}%` }} />
                 </div>
             </div>
         </div>

         <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 md:w-[450px]">
            <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder={t("Add custom item...", "직접 항목 추가하기...")}
                className="flex-1 px-4 py-3 bg-transparent border-none outline-none font-medium text-slate-800 placeholder:text-slate-400"
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
            />
            <button
                onClick={addItem}
                className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-700 transition-colors"
            >
                <Plus size={20} />
            </button>
         </div>
      </div>

      {/* Checklist Grid */}
      <div className="masonry-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {categories.map(cat => (
          <div key={cat} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="text-slate-400 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                 {getCategoryIcon(cat)}
              </div>
              <h3 className="font-bold text-slate-800 text-lg font-heading">{cat}</h3>
            </div>
            <div className="p-2">
              {items.filter(i => i.category === cat).map(item => (
                <div
                    key={item.id}
                    className={`flex items-center p-3 rounded-xl transition-all cursor-pointer hover:bg-slate-50 group/item ${item.checked ? 'opacity-50' : 'opacity-100'}`}
                    onClick={() => toggleItem(item.id)}
                >
                  <div className={`w-6 h-6 rounded-lg border-2 mr-3 flex items-center justify-center transition-colors ${item.checked ? 'bg-teal-500 border-teal-500' : 'border-slate-200 bg-white group-hover/item:border-teal-400'}`}>
                      {item.checked && <Check size={14} className="text-white" strokeWidth={4} />}
                  </div>
                  <span className={`flex-1 font-medium text-sm ${item.checked ? 'text-slate-400 line-through decoration-2 decoration-slate-200' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                    className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover/item:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
           <div className="text-center py-24 text-slate-400 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
             <div className="bg-white p-6 rounded-full inline-block shadow-sm mb-4">
                <Package size={40} className="text-slate-300" />
             </div>
             <h3 className="text-lg font-bold text-slate-600 mb-2">{t("List is empty", "리스트가 비었습니다")}</h3>
             <p>{t("Enter your destination above to generate a packing list.", "위에서 목적지를 입력하고 패킹 리스트를 생성해보세요.")}</p>
           </div>
        )}
    </div>
  );
};

export default Checklist;
