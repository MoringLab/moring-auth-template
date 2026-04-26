'use client';

import React, { useState, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Search, DollarSign, FileWarning, Loader2, ShieldCheck, Upload, FileText, X, AlertOctagon, ArrowRight, ScanLine } from 'lucide-react';
import { analyzeReliability } from '@/services/geminiService';
import { ReliabilityReport } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import FormattedText from './FormattedText';

const ReliabilityChecker: React.FC = () => {
  const { t, aiLanguage } = useLanguage();
  const [details, setDetails] = useState('');
  const [file, setFile] = useState<{ name: string, type: string, base64: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReliabilityReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFile({
          name: selected.name,
          type: selected.type,
          base64: base64String
        });
      };
      reader.readAsDataURL(selected);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!details.trim() && !file) return;
    setLoading(true);
    const result = await analyzeReliability(details, file?.base64 || null, file?.type || null, aiLanguage);
    setReport(result);
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'bg-yellow-50 border-yellow-100';
    return 'bg-red-50 border-red-100';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 px-2">
         <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 shadow-sm">
            <ShieldCheck size={32} />
         </div>
         <div>
            <h2 className="text-3xl font-black text-slate-900 font-heading">{t("Reliability Audit", "프로그램 신뢰도 분석")}</h2>
            <p className="text-slate-500 font-medium text-lg">{t("AI detects hidden costs and risks in brochures.", "AI가 브로셔 내 숨겨진 비용과 위험 요소를 즉시 감지합니다.")}</p>
         </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 h-full">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-4 space-y-6 h-full">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 h-full flex flex-col relative overflow-hidden">
             <div className="relative z-10 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 mb-6 font-heading flex items-center gap-2">
                  <ScanLine size={20} className="text-slate-400"/>
                  {t("Input Data", "분석 데이터 입력")}
                </h3>

                <div className="space-y-5 flex-1">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{t("Program Text", "프로그램 텍스트")}</label>
                      <textarea
                        className="w-full h-48 p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-base text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed font-medium outline-none"
                        placeholder={t(
                          "Paste brochure text, website content, or contract details here...",
                          "브로셔 내용, 웹사이트 텍스트, 또는 계약서 내용을 여기에 붙여넣으세요..."
                        )}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                      />
                   </div>

                   <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{t("Attachment", "파일 첨부")}</label>
                       <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,image/*" className="hidden" />
                       {!file ? (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:bg-slate-50 hover:border-emerald-400 hover:text-emerald-600 transition-all flex items-center justify-center gap-2 group"
                        >
                          <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-emerald-100 transition-colors">
                            <Upload size={18} />
                          </div>
                          {t("Upload PDF or Image", "PDF 또는 이미지 업로드")}
                        </button>
                       ) : (
                        <div className="flex items-center justify-between bg-emerald-50 px-5 py-4 rounded-2xl border border-emerald-100 group">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                                <FileText size={18} className="text-emerald-600 flex-shrink-0" />
                            </div>
                            <span className="text-sm font-bold text-emerald-900 truncate">{file.name}</span>
                          </div>
                          <button onClick={clearFile} className="text-emerald-400 hover:text-red-500 hover:bg-red-50 rounded-lg p-2 transition-all"><X size={18}/></button>
                        </div>
                       )}
                   </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={loading || (!details && !file)}
                  className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                  <span>{t("Run Audit", "정밀 분석 시작")}</span>
                </button>
             </div>
          </div>
        </div>

        {/* Right Column: Report */}
        <div className="lg:col-span-8">
          {report ? (
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-fade-in h-full flex flex-col">
              {/* Score Header */}
              <div className="relative p-10 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white">
                 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                     <div>
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getScoreBg(report.score)} text-slate-600`}>
                             AI Verdict
                           </span>
                           <span className={`text-sm font-black uppercase tracking-wide ${
                               report.verdict === 'Safe' ? 'text-emerald-600' :
                               report.verdict === 'Caution' ? 'text-yellow-600' : 'text-red-600'
                           }`}>
                             {report.verdict}
                           </span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 font-heading tracking-tight">Reliability Score</h3>
                     </div>

                     <div className="flex items-center gap-6">
                        <div className="text-right">
                            <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Trust Index</span>
                            <span className={`text-6xl font-black tracking-tighter ${getScoreColor(report.score)}`}>
                                {report.score}
                            </span>
                        </div>
                        <div className={`w-20 h-20 rounded-full border-[6px] flex items-center justify-center ${
                            report.score >= 80 ? 'border-emerald-100 bg-emerald-50' :
                            report.score >= 60 ? 'border-yellow-100 bg-yellow-50' : 'border-red-100 bg-red-50'
                        }`}>
                            {report.score >= 80 ? <CheckCircle2 size={32} className="text-emerald-500"/> :
                             report.score >= 60 ? <AlertOctagon size={32} className="text-yellow-500"/> : <AlertTriangle size={32} className="text-red-500"/>}
                        </div>
                     </div>
                 </div>
              </div>

              <div className="flex-1 p-10 bg-white space-y-10">
                 {/* Summary Box */}
                 <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative group hover:border-slate-300 transition-colors">
                    <div className="absolute -left-3 top-8 w-6 h-6 bg-slate-200 rounded-full border-4 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">{t("Executive Summary", "종합 요약")}</h4>
                    <div className="text-slate-700 text-lg font-medium leading-relaxed ml-2">
                        <FormattedText text={report.summary} />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    {/* Critical Risks */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between border-b-2 border-red-100 pb-3">
                           <h4 className="flex items-center gap-2 text-red-600 font-black text-sm uppercase tracking-wide">
                              <AlertOctagon size={18}/> {t("Critical Risks", "주요 위험 요소")}
                           </h4>
                           <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md">{report.redFlags.length}</span>
                       </div>

                       {report.redFlags.length > 0 ? (
                           <ul className="space-y-3">
                              {report.redFlags.map((flag, i) => (
                                 <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-red-50/50 hover:bg-red-50 transition-colors">
                                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5"/>
                                    <span className="text-sm text-slate-700 font-bold leading-snug">{flag}</span>
                                 </li>
                              ))}
                           </ul>
                       ) : (
                           <div className="p-4 text-slate-400 text-sm font-medium italic bg-slate-50 rounded-xl text-center">
                               {t("No critical risks detected.", "감지된 위험 요소가 없습니다.")}
                           </div>
                       )}
                    </div>

                    {/* Hidden Costs */}
                    <div className="space-y-4">
                       <div className="flex items-center justify-between border-b-2 border-orange-100 pb-3">
                           <h4 className="flex items-center gap-2 text-orange-600 font-black text-sm uppercase tracking-wide">
                              <DollarSign size={18}/> {t("Hidden Costs", "숨겨진 비용")}
                           </h4>
                           <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-md">{report.hiddenCosts.length}</span>
                       </div>

                       {report.hiddenCosts.length > 0 ? (
                           <ul className="space-y-3">
                              {report.hiddenCosts.map((cost, i) => (
                                 <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-orange-50/50 hover:bg-orange-50 transition-colors">
                                    <FileWarning size={16} className="text-orange-500 shrink-0 mt-0.5"/>
                                    <span className="text-sm text-slate-700 font-bold leading-snug">{cost}</span>
                                 </li>
                              ))}
                           </ul>
                       ) : (
                           <div className="p-4 text-slate-400 text-sm font-medium italic bg-slate-50 rounded-xl text-center">
                               {t("No hidden costs detected.", "숨겨진 비용이 감지되지 않았습니다.")}
                           </div>
                       )}
                    </div>
                 </div>

                 {/* Inclusion/Exclusion Tags */}
                 <div className="pt-8 border-t border-slate-100">
                     <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">{t("Coverage Analysis", "포함/불포함 분석")}</h4>
                     <div className="flex flex-wrap gap-3">
                        {report.included.map((inc, i) => (
                          <div key={i} className="pl-3 pr-4 py-2 rounded-xl bg-slate-50 text-slate-700 text-sm font-bold border border-slate-200 flex items-center gap-2 group hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-default">
                            <CheckCircle2 size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                            {inc}
                          </div>
                        ))}
                        {report.excluded.map((exc, i) => (
                          <div key={i} className="pl-3 pr-4 py-2 rounded-xl bg-white text-slate-400 text-sm font-medium border border-slate-100 flex items-center gap-2 decoration-slate-300 decoration-2">
                            <X size={14} className="text-slate-300" />
                            {exc}
                          </div>
                        ))}
                     </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[600px] bg-white rounded-[2.5rem] shadow-lg border border-slate-200 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
               <div className="absolute inset-0 bg-slate-50/50"></div>
               <div className="relative z-10 max-w-sm">
                   <div className="w-24 h-24 bg-white rounded-full shadow-sm mb-8 mx-auto flex items-center justify-center text-slate-200">
                     <Search size={40} />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800 mb-3 font-heading">{t("Ready to Audit", "분석 준비 완료")}</h3>
                   <p className="text-slate-500 font-medium leading-relaxed">
                     {t(
                       "Enter program details on the left to generate a comprehensive reliability report.",
                       "왼쪽에 프로그램 상세 내용을 입력하거나 파일을 업로드하면, AI가 정밀 신뢰도 리포트를 생성합니다."
                     )}
                   </p>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReliabilityChecker;
