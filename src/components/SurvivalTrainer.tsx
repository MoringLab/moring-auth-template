'use client';

import React, { useState } from 'react';
import { Volume2, Mic, PlayCircle, Sparkles, Loader2, MessageCircle, Search, Headphones, Repeat } from 'lucide-react';
import { generateSurvivalPhrases } from '@/services/geminiService';
import { useLanguage } from '@/contexts/LanguageContext';
import { Phrase } from '@/types';

const SurvivalTrainer: React.FC = () => {
  const { t, aiLanguage } = useLanguage();
  const [customScenario, setCustomScenario] = useState("");
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);

  const presets = ["Airport Immigration", "Ordering Fast Food", "First Day at Homestay", "Making Friends", "Buying Sim Card", "Hospital"];

  const handleGenerate = async (scenario: string) => {
    setLoading(true);
    setCustomScenario(scenario);
    const result = await generateSurvivalPhrases(scenario, aiLanguage);
    setPhrases(result);
    setLoading(false);
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header & Search */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-pink-50 rounded-full opacity-50 blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-pink-100 p-3 rounded-2xl text-pink-600">
                  <Headphones size={28} />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-900 font-heading">{t("Survival English", "생존 영어 트레이너")}</h2>
                  <p className="text-slate-500 font-medium">{t("Master essential phrases for specific situations.", "특정 상황에 꼭 필요한 핵심 표현을 마스터하세요.")}</p>
               </div>
            </div>

            <div className="relative mb-6">
               <Search className="absolute left-5 top-4 text-slate-400" size={20} />
               <input
                 type="text"
                 value={customScenario}
                 onChange={(e) => setCustomScenario(e.target.value)}
                 placeholder={t("What situation are you preparing for? (e.g. Lost Luggage)", "어떤 상황을 준비하시나요? (예: 짐 분실)")}
                 className="w-full pl-12 pr-32 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:border-pink-500 outline-none font-bold text-slate-800 transition-all text-lg placeholder:text-slate-400"
                 onKeyDown={(e) => e.key === 'Enter' && handleGenerate(customScenario)}
               />
               <button
                 onClick={() => handleGenerate(customScenario)}
                 disabled={loading || !customScenario}
                 className="absolute right-2 top-2 bottom-2 bg-pink-600 hover:bg-pink-700 text-white px-6 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-md shadow-pink-200"
               >
                 {loading ? <Loader2 className="animate-spin" /> : t("Generate", "생성")}
               </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider py-2 mr-1">{t("Popular:", "인기 키워드:")}</span>
              {presets.map(preset => (
                <button
                  key={preset}
                  onClick={() => handleGenerate(preset)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:border-pink-400 hover:bg-pink-50 hover:text-pink-700 text-slate-600 rounded-full text-sm font-bold transition-all shadow-sm"
                >
                  {preset}
                </button>
              ))}
            </div>
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center animate-pulse flex flex-col items-center">
           <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
             <Loader2 className="w-8 h-8 text-pink-600 animate-spin" />
           </div>
           <h3 className="text-xl font-bold text-slate-800">{t("Creating your lesson...", "맞춤형 레슨을 생성 중입니다...")}</h3>
        </div>
      )}

      <div className="grid gap-4 animate-fade-in">
        {phrases.map((phrase, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg hover:border-pink-300 transition-all flex flex-col md:flex-row items-center gap-6 group">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-pink-600 group-hover:text-white transition-colors">
              {idx + 1}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-bold text-slate-800 mb-2 font-heading group-hover:text-pink-700 transition-colors">{phrase.text}</h3>
              <p className="text-lg text-slate-500 font-medium">{phrase.translation}</p>
              {phrase.note && <div className="mt-3 inline-block px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-lg border border-yellow-100">{phrase.note}</div>}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => speak(phrase.text)}
                className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-pink-600 hover:border-pink-600 hover:text-white transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                title="Listen"
              >
                <Volume2 size={24} />
              </button>

              <button
                className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 text-slate-700 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all flex items-center justify-center shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                title="Repeat"
                onClick={() => alert(t("Practice mode: Repeat out loud!", "연습 모드: 큰 소리로 따라해보세요!"))}
              >
                <Mic size={24} />
              </button>
            </div>
          </div>
        ))}

        {!loading && phrases.length === 0 && (
           <div className="text-center py-24 text-slate-400 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium">{t("Select a scenario above to start practicing.", "위에서 상황을 선택하여 연습을 시작하세요.")}</p>
           </div>
        )}
      </div>

      {phrases.length > 0 && (
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex items-center justify-between shadow-2xl shadow-slate-900/20 overflow-hidden relative group cursor-pointer hover:bg-slate-800 transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500 rounded-full mix-blend-overlay opacity-20 blur-3xl -mr-16 -mt-16 group-hover:opacity-30 transition-opacity"></div>
          <div className="relative z-10 flex items-center gap-6">
             <div className="bg-white/10 p-4 rounded-full backdrop-blur-sm">
               <Repeat size={32} className="text-pink-400" />
             </div>
             <div>
                <h4 className="font-black text-2xl font-heading mb-1">{t("Daily Mission", "오늘의 미션")}</h4>
                <p className="text-slate-400 font-medium">{t("Repeat these 5 phrases until fluent.", "이 5문장이 자연스러워질 때까지 반복하세요.")}</p>
             </div>
          </div>
          <div className="relative z-10 hidden md:block">
             <button className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-900/50">
               {t("Start Drill", "연습 시작")}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurvivalTrainer;
