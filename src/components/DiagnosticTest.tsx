'use client';

import React, { useState } from 'react';
import { ArrowRight, User, Users, Sparkles, Loader2, CheckCircle2, MapPin, Clock, FileText, RefreshCw, Trophy } from 'lucide-react';
import { DiagnosticResult, DiagnosticQuestion, DiagnosticAnswer } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateDiagnosticReport, generateDiagnosticQuestions } from '@/services/geminiService';
import FormattedText from './FormattedText';

const DiagnosticTest: React.FC = () => {
  const { t, aiLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');

  // Context State
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [details, setDetails] = useState('');

  // Status Flow: idle -> setup -> loading_questions -> testing -> analyzing -> complete
  const [status, setStatus] = useState<'idle' | 'setup' | 'loading_questions' | 'testing' | 'analyzing' | 'complete'>('idle');

  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [answers, setAnswers] = useState<DiagnosticAnswer[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  const [textInput, setTextInput] = useState('');

  const handleRoleSelect = (role: 'student' | 'parent') => {
    setActiveTab(role);
    setStatus('setup');
  };

  const startTest = async () => {
    setStatus('loading_questions');
    setAnswers([]);
    setCurrentStep(0);
    setResult(null);

    const generatedQuestions = await generateDiagnosticQuestions(
      activeTab,
      aiLanguage,
      { destination, duration, details }
    );
    setQuestions(generatedQuestions);
    setStatus('testing');
  };

  const handleAnswer = (answerValue: string | number) => {
    const currentQ = questions[currentStep];
    const newAnswer: DiagnosticAnswer = {
      questionId: currentQ.id,
      questionText: currentQ.question,
      answer: answerValue
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setTextInput('');

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishTest(updatedAnswers);
    }
  };

  const finishTest = async (finalAnswers: DiagnosticAnswer[]) => {
    setStatus('analyzing');
    const report = await generateDiagnosticReport(activeTab, finalAnswers, aiLanguage);
    setResult(report);
    setStatus('complete');
  };

  const restart = () => {
    setStatus('idle');
    setDestination('');
    setDuration('');
    setDetails('');
  };

  const renderQuestionInput = () => {
    const q = questions[currentStep];

    if (q.type === 'scale') {
      return (
        <div className="grid grid-cols-1 gap-3 animate-fade-in">
          {[
            { val: 5, label: t("Strongly Agree", "매우 그렇다") },
            { val: 4, label: t("Agree", "그렇다") },
            { val: 3, label: t("Neutral", "보통이다") },
            { val: 2, label: t("Disagree", "아니다") },
            { val: 1, label: t("Strongly Disagree", "전혀 아니다") }
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => handleAnswer(opt.val)}
              className="w-full text-left px-8 py-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all flex justify-between group"
            >
              <span className="font-bold text-lg text-slate-700 group-hover:text-blue-700">{opt.label}</span>
              <ArrowRight className="text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2" />
            </button>
          ))}
        </div>
      );
    }

    if (q.type === 'choice' && q.options) {
      return (
        <div className="grid grid-cols-1 gap-3 animate-fade-in">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(opt)}
              className="w-full text-left px-8 py-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-500 hover:bg-blue-50 hover:shadow-md transition-all flex justify-between group"
            >
               <span className="font-bold text-lg text-slate-700 group-hover:text-blue-700">{opt}</span>
               <CheckCircle2 className="text-slate-300 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110" />
            </button>
          ))}
        </div>
      );
    }

    if (q.type === 'text') {
      return (
        <div className="space-y-6 animate-fade-in">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={t("Type your answer here...", "여기에 답변을 입력하세요...")}
            className="w-full p-6 border-2 border-slate-100 bg-slate-50 rounded-2xl focus:bg-white focus:border-blue-500 outline-none h-40 text-slate-900 placeholder:text-slate-400 text-lg font-medium resize-none shadow-inner transition-all"
          />
          <button
            onClick={() => handleAnswer(textInput)}
            disabled={!textInput.trim()}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200"
          >
            {t("Submit Answer", "답변 제출")}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {status === 'idle' && (
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-200 text-center min-h-[500px] flex flex-col justify-center">
          <div className="mb-8">
             <div className="inline-flex bg-blue-50 p-5 rounded-3xl text-blue-600 mb-6 shadow-sm">
               <Sparkles size={48} />
             </div>
             <h2 className="text-4xl font-black text-slate-900 font-heading mb-4 tracking-tight">{t("Readiness Diagnostic", "유학 준비도 정밀 진단")}</h2>
             <p className="text-lg text-slate-500 max-w-lg mx-auto font-medium leading-relaxed">
               {t(
                 "AI generates a unique interview to check your mental and practical readiness.",
                 "AI가 1:1 인터뷰를 통해 당신의 심리적, 실질적 준비 상태를 정밀하게 분석합니다."
               )}
             </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <button
              onClick={() => handleRoleSelect('student')}
              className="p-8 rounded-[2rem] bg-slate-50 border-2 border-transparent hover:bg-white hover:border-blue-500 hover:shadow-xl transition-all group text-left relative overflow-hidden"
            >
              <div className="bg-blue-100 p-4 rounded-2xl w-fit mb-4 text-blue-600 group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <span className="block text-2xl font-bold text-slate-800 mb-1 font-heading">{t("I'm a Student", "학생입니다")}</span>
              <span className="text-sm text-slate-500 font-medium">{t("Check confidence & habits", "자신감 및 생활습관 체크")}</span>
            </button>

            <button
              onClick={() => handleRoleSelect('parent')}
              className="p-8 rounded-[2rem] bg-slate-50 border-2 border-transparent hover:bg-white hover:border-emerald-500 hover:shadow-xl transition-all group text-left relative overflow-hidden"
            >
               <div className="bg-emerald-100 p-4 rounded-2xl w-fit mb-4 text-emerald-600 group-hover:scale-110 transition-transform">
                <Users size={32} />
              </div>
              <span className="block text-2xl font-bold text-slate-800 mb-1 font-heading">{t("I'm a Parent", "학부모입니다")}</span>
              <span className="text-sm text-slate-500 font-medium">{t("Check expectations & risk", "기대치 및 리스크 관리")}</span>
            </button>
          </div>
        </div>
      )}

      {status === 'setup' && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 animate-fade-in">
           <div className="mb-8 text-center">
              <h3 className="text-3xl font-black text-slate-900 font-heading">
                {activeTab === 'student' ? t("Tell us about your trip", "여행 정보를 알려주세요") : t("Tell us about the plan", "자녀의 유학 계획")}
              </h3>
              <p className="text-slate-500 mt-2 font-medium">{t("AI will customize questions based on this info.", "이 정보를 바탕으로 AI가 맞춤형 질문을 생성합니다.")}</p>
           </div>

           <div className="space-y-6 max-w-lg mx-auto">
             <div className="space-y-2">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{t("Destination", "목적지")}</label>
               <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-slate-400" size={20}/>
                  <input
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 bg-slate-50 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-slate-900 font-bold text-lg transition-all placeholder:text-slate-400"
                    placeholder={t("e.g. London, UK", "예: 영국 런던")}
                  />
               </div>
             </div>

             <div className="space-y-2">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{t("Duration", "기간")}</label>
               <div className="relative">
                  <Clock className="absolute left-4 top-4 text-slate-400" size={20}/>
                  <input
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 bg-slate-50 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-slate-900 font-bold text-lg transition-all placeholder:text-slate-400"
                    placeholder={t("e.g. 4 weeks", "예: 4주")}
                  />
               </div>
             </div>

             <div className="space-y-2">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{t("Program Details / Worries", "특이사항 / 걱정되는 점")}</label>
               <div className="relative">
                  <FileText className="absolute left-4 top-4 text-slate-400" size={20}/>
                  <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 bg-slate-50 rounded-xl focus:bg-white focus:border-blue-500 outline-none h-32 resize-none text-slate-900 font-medium transition-all placeholder:text-slate-400"
                    placeholder={t("e.g. Homestay, First time abroad...", "예: 홈스테이, 첫 해외 경험 등...")}
                  />
               </div>
             </div>

             <button
               onClick={startTest}
               disabled={!destination || !duration}
               className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all disabled:opacity-50 mt-4 shadow-xl shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]"
             >
               {t("Start Interview", "인터뷰 시작하기")}
             </button>
           </div>
        </div>
      )}

      {status === 'loading_questions' && (
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
           <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
           <h3 className="text-2xl font-bold text-slate-800 font-heading">{t("AI is preparing your interview...", "AI가 맞춤형 질문을 준비하고 있습니다...")}</h3>
           <p className="text-slate-500 mt-2 font-medium">{t("Analyzing context for", "분석 중:")} <span className="text-blue-600 font-bold">{destination}</span></p>
        </div>
      )}

      {status === 'testing' && questions.length > 0 && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative min-h-[500px] flex flex-col">
            <div className="p-10 border-b border-slate-100 bg-slate-50/30">
              <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                <span>Question {currentStep + 1} / {questions.length}</span>
                <span>{Math.round(((currentStep) / questions.length) * 100)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${((currentStep) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-10 flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
               <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-black self-start mb-6 uppercase tracking-wide">
                 {questions[currentStep].type === 'scale' ? t("Agreement Check", "동의 정도") :
                  questions[currentStep].type === 'choice' ? t("Scenario Choice", "상황 선택") :
                  t("Deep Thought", "주관식")}
               </span>
               <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10 leading-tight font-heading">
                 {questions[currentStep].question}
               </h3>
               {renderQuestionInput()}
            </div>
        </div>
      )}

      {status === 'analyzing' && (
         <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
           <div className="relative mb-6">
              <Sparkles className="w-20 h-20 text-purple-500 animate-pulse" />
              <div className="absolute inset-0 blur-xl bg-purple-400 opacity-30"></div>
           </div>
           <h3 className="text-2xl font-bold text-slate-800 font-heading">{t("Analyzing your answers...", "답변을 정밀 분석 중입니다...")}</h3>
           <p className="text-slate-500 mt-2 font-medium">{t("Consulting with AI study abroad expert...", "AI 유학 전문가가 리포트를 작성하고 있습니다...")}</p>
        </div>
      )}

      {status === 'complete' && result && (
        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 animate-fade-in">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="inline-flex bg-yellow-400 p-4 rounded-full text-white mb-6 shadow-lg shadow-yellow-200 ring-8 ring-yellow-50">
                <Trophy size={48} fill="currentColor" />
            </div>

            <div className={`relative inline-flex items-center justify-center w-40 h-40 rounded-full bg-white mb-8 border-4 shadow-2xl ${result.score > 70 ? 'border-emerald-100 ring-8 ring-emerald-50' : 'border-orange-100 ring-8 ring-orange-50'}`}>
              <div className="text-center">
                  <span className={`block text-6xl font-black tracking-tighter ${result.score > 70 ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {result.score}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score</span>
              </div>
            </div>

            <div className="max-w-2xl bg-slate-50 p-8 rounded-3xl border border-slate-100">
               <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{t("Executive Summary", "종합 진단")}</h2>
               <div className="text-slate-700 text-lg font-medium leading-relaxed">
                 <FormattedText text={result.feedback} className="text-slate-700" />
               </div>
            </div>
          </div>

          <div className="grid gap-6">
            <h4 className="font-black text-slate-800 text-xl flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-indigo-600" />
              {t("Your Action Plan", "맞춤형 액션 플랜")}
            </h4>
            {result.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group">
                <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black text-lg flex items-center justify-center mr-5 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {idx + 1}
                </span>
                <span className="text-slate-700 font-bold text-lg leading-snug pt-1.5">{tip}</span>
              </div>
            ))}
          </div>

          <button
            onClick={restart}
            className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            {t("Restart Test", "테스트 다시 하기")}
          </button>
        </div>
      )}
    </div>
  );
};

export default DiagnosticTest;
