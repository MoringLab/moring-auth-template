'use client';

import React, { useState } from 'react';
import { Calendar, Loader2, Download, MapPin, Clock, Sun, Moon, BookOpen, RefreshCw, BarChart3 } from 'lucide-react';
import { generateRoutine } from '@/services/geminiService';
import { RoutineItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

const RoutineDesigner: React.FC = () => {
  const { t, aiLanguage } = useLanguage();
  const [level, setLevel] = useState('Intermediate');
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState(5);
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!destination) return;
    setLoading(true);
    const data = await generateRoutine(destination, duration, level, aiLanguage);
    setRoutine(data);
    setLoading(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-60"></div>

        <div className="relative z-10 mb-8 text-center md:text-left flex justify-between items-end">
          <div>
            <div className="inline-flex bg-violet-100 p-3 rounded-2xl text-violet-600 mb-4">
               <Calendar size={28} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 font-heading mb-2">{t("Routine Designer", "성공 루틴 생성기")}</h2>
            <p className="text-slate-500 font-medium text-lg">{t("Design your perfect study abroad schedule.", "목적지와 레벨에 딱 맞는 100% 맞춤형 스케줄.")}</p>
          </div>
        </div>

        <div className="relative z-10 bg-slate-50 p-3 rounded-[1.5rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Destination Input */}
          <div className="md:col-span-5 relative bg-white rounded-xl border border-slate-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all group">
             <label className="absolute left-10 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-violet-500">{t("Destination", "목적지")}</label>
             <MapPin className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
             <input
                 type="text"
                 value={destination}
                 onChange={e => setDestination(e.target.value)}
                 placeholder={t("e.g. London", "예: 런던")}
                 className="w-full pl-10 pr-4 pt-6 pb-2 bg-transparent outline-none text-slate-900 font-bold h-full placeholder:text-slate-300"
             />
          </div>

          {/* Duration Input (Improved) */}
          <div className="md:col-span-3 relative bg-white rounded-xl border border-slate-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all group">
             <label className="absolute left-10 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-violet-500">{t("Duration", "기간")}</label>
             <Clock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
             <select
                 value={duration}
                 onChange={e => setDuration(parseInt(e.target.value) || 1)}
                 className="w-full pl-10 pr-8 pt-6 pb-2 bg-transparent outline-none text-slate-900 font-bold h-full appearance-none cursor-pointer"
             >
               {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24].map(w => (
                 <option key={w} value={w}>{w} {t("Weeks", "주")}</option>
               ))}
             </select>
             <div className="absolute right-4 top-1/2 translate-y-1 pointer-events-none text-slate-400 font-black text-[10px]">▼</div>
          </div>

          {/* Level Input */}
          <div className="md:col-span-3 relative bg-white rounded-xl border border-slate-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all group">
              <label className="absolute left-10 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-violet-500">{t("Level", "레벨")}</label>
              <BarChart3 className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={18} />
              <select
                  value={level}
                  onChange={e => setLevel(e.target.value)}
                  className="w-full pl-10 pr-8 pt-6 pb-2 bg-transparent outline-none text-slate-900 font-bold h-full appearance-none cursor-pointer"
                >
                  <option value="Beginner">{t("Beginner", "입문 (Beginner)")}</option>
                  <option value="Intermediate">{t("Intermediate", "중급 (Intermediate)")}</option>
                  <option value="Advanced">{t("Advanced", "고급 (Advanced)")}</option>
                </select>
                <div className="absolute right-4 top-1/2 translate-y-1 pointer-events-none text-slate-400 font-black text-[10px]">▼</div>
          </div>

          {/* Submit Button */}
          <div className="md:col-span-1">
            <button
              onClick={handleGenerate}
              disabled={loading || !destination}
              className="w-full h-full min-h-[60px] bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center shadow-lg shadow-violet-200 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            </button>
          </div>
        </div>
      </div>

      {routine.length > 0 && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center px-4">
             <h3 className="text-2xl font-black text-slate-800">{t("Your Weekly Roadmap", "주간 로드맵")}</h3>
             <button className="text-violet-600 hover:text-violet-800 font-bold text-sm flex items-center space-x-2 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100 transition-colors">
                <Download size={16} />
                <span>Save PDF</span>
             </button>
          </div>

          <div className="space-y-6 relative">
            {/* Vertical Line */}
            <div className="absolute left-8 top-6 bottom-6 w-0.5 bg-slate-200 hidden md:block"></div>

            {routine.map((item, idx) => (
              <div key={idx} className="relative md:pl-20">
                {/* Timeline Node */}
                <div className="absolute left-2 top-8 w-12 h-12 rounded-full bg-white border-4 border-slate-100 shadow-sm z-10 hidden md:flex items-center justify-center font-black text-slate-400 text-sm">
                   {item.week}
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center">
                        <div>
                            <span className="text-slate-400 font-black text-xs uppercase tracking-widest mr-2">Week {item.week}</span>
                            <h4 className="inline text-xl font-black text-slate-800">Day {item.day}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold uppercase text-slate-400">{t("Goal", "목표")}</span>
                            <span className="text-sm font-bold text-violet-600 bg-violet-50 px-4 py-1.5 rounded-full border border-violet-100 shadow-sm">
                                {item.focus}
                            </span>
                        </div>
                    </div>

                    <div className="p-8 grid md:grid-cols-3 gap-8 relative">
                        {/* Card Content */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-orange-500 font-black text-xs uppercase tracking-wider">
                                <Sun size={16} />
                                <span>Morning Ritual</span>
                            </div>
                            <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 h-full">{item.morning}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-violet-500 font-black text-xs uppercase tracking-wider">
                                <BookOpen size={16} />
                                <span>Key Mission</span>
                            </div>
                            <p className="text-white font-bold leading-relaxed bg-violet-500 p-4 rounded-2xl shadow-lg shadow-violet-200 h-full flex items-center">{item.school}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-wider">
                                <Moon size={16} />
                                <span>Evening Review</span>
                            </div>
                            <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 h-full">{item.evening}</p>
                        </div>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && routine.length === 0 && (
        <div className="text-center py-32 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="bg-white p-6 rounded-full inline-block shadow-sm mb-6">
             <Calendar className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-400 mb-2">{t("No Routine Yet", "루틴이 없습니다")}</h3>
          <p className="text-slate-400 font-medium">{t("Enter details above to generate your plan.", "위에서 정보를 입력하고 플랜을 생성하세요.")}</p>
        </div>
      )}
    </div>
  );
};

export default RoutineDesigner;
