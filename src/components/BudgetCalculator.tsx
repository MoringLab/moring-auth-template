'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Sparkles, Loader2, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { BudgetData } from '@/types';
import { estimateBudget } from '@/services/geminiService';
import { useLanguage } from '@/contexts/LanguageContext';

const BudgetCalculator: React.FC = () => {
  const { t, aiLanguage } = useLanguage();
  const [city, setCity] = useState('');
  const [duration, setDuration] = useState(4);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<BudgetData>({
    programFee: 0,
    flight: 0,
    pocketMoney: 0,
    insurance: 0,
    shopping: 0,
    emergency: 0,
  });

  const handleEstimate = async () => {
    if (!city) return;
    setLoading(true);
    const estimated = await estimateBudget(city, duration, aiLanguage);
    setData(estimated);
    setLoading(false);
  };

  const total = (Object.values(data) as number[]).reduce((acc, curr) => acc + curr, 0);

  const chartData = [
    { name: t('Program Fee', '프로그램비'), value: data.programFee, color: '#3b82f6' },
    { name: t('Flights', '항공권'), value: data.flight, color: '#6366f1' },
    { name: t('Pocket Money', '용돈'), value: data.pocketMoney, color: '#10b981' },
    { name: t('Insurance', '보험'), value: data.insurance, color: '#f59e0b' },
    { name: t('Shopping', '쇼핑'), value: data.shopping, color: '#ec4899' },
    { name: t('Emergency', '비상금'), value: data.emergency, color: '#64748b' },
  ];

  const handleChange = (key: keyof BudgetData, val: string) => {
    setData({ ...data, [key]: Number(val) || 0 });
  };

  return (
    <div className="space-y-6">
       {/* Header Card */}
       <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200">
        <div className="flex items-center gap-4 mb-8">
            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                <TrendingUp size={28} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900 font-heading">{t("Budget Estimator", "유학 비용 계산기")}</h2>
                <p className="text-slate-500 font-medium">{t("AI estimates total costs based on city & duration.", "도시와 기간을 입력하면 AI가 예상 총비용을 산출합니다.")}</p>
            </div>
        </div>

        <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
             <label className="absolute left-5 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("City/Country", "도시/국가")}</label>
             <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. New York"
                className="w-full px-5 pt-6 pb-2 bg-white rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-800"
             />
          </div>
          <div className="w-full md:w-40 relative">
             <label className="absolute left-5 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Duration (Weeks)", "기간 (주)")}</label>
             <input
                type="number"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full px-5 pt-6 pb-2 bg-white rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-bold text-slate-800"
             />
          </div>
          <button
            onClick={handleEstimate}
            disabled={loading || !city}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg shadow-orange-200 transition-all"
          >
             {loading ? <Loader2 className="animate-spin"/> : <DollarSign size={20}/>}
             <span>{t("Calculate", "견적 내기")}</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Inputs */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200 h-full">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-sm">1</span>
            {t("Cost Breakdown", "비용 상세 내역")}
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
             {Object.keys(data).map((key) => (
                <div key={key} className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{
                       key === 'programFee' ? t('Program Fee', '프로그램비 (학비/숙소)') :
                       key === 'flight' ? t('Flights', '항공권') :
                       key === 'pocketMoney' ? t('Pocket Money', '용돈/생활비') :
                       key === 'insurance' ? t('Insurance', '보험') :
                       key === 'shopping' ? t('Shopping', '쇼핑') : t('Emergency', '비상금')
                    }</label>
                    <div className="relative group">
                       <span className="absolute left-4 top-4 text-slate-400 font-bold">$</span>
                       <input
                         type="number"
                         value={data[key as keyof BudgetData]}
                         onChange={e => handleChange(key as keyof BudgetData, e.target.value)}
                         className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-800 transition-all group-hover:bg-white"
                       />
                    </div>
                </div>
             ))}
          </div>
        </div>

        {/* Right: Visualization */}
        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-2xl shadow-slate-900/20 text-white flex flex-col">
          <h3 className="text-lg font-black text-slate-300 mb-2 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 text-sm">2</span>
            {t("Total Estimate", "총 예상 비용")}
          </h3>

          <div className="mt-4 mb-8">
             <div className="text-5xl font-black tracking-tighter text-white mb-1">
               ${total.toLocaleString()}
             </div>
             <p className="text-slate-500 text-sm font-medium">USD / {duration} weeks</p>
          </div>

          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                    formatter={(value: number) => `$${value}`}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', opacity: 0.7}}/>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
               <DollarSign size={32} className="text-slate-700 opacity-50" />
            </div>
          </div>

          {total > 0 && (
             <div className="mt-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-3">
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-slate-400 leading-relaxed">
                   {t("Always prepare 20% extra for emergencies.", "항상 20% 정도의 비상금을 추가로 준비하는 것이 안전합니다.")}
                </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetCalculator;
