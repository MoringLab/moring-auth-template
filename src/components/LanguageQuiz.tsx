'use client';

import React, { useState } from 'react';
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, Trophy, Loader2, RotateCcw, Globe, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateQuiz } from '@/services/geminiService';
import { QuizQuestion, QuizDifficulty, QuizType } from '@/types';

const shuffleArray = (array: string[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

const LanguageQuiz: React.FC = () => {
  const { t, aiLanguage } = useLanguage();
  const [region, setRegion] = useState('');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Intermediate');
  const [type, setType] = useState<QuizType>('Vocabulary');
  const [status, setStatus] = useState<'setup' | 'loading' | 'quiz' | 'result'>('setup');

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const startQuiz = async () => {
    if (!region) return;
    setStatus('loading');
    setScore(0);
    setCurrentIdx(0);
    const generatedQuestions = await generateQuiz(region, difficulty, type, aiLanguage);
    const shuffledQuestions = generatedQuestions.map(q => ({
      ...q,
      options: q.options ? shuffleArray(q.options) : q.options
    }));
    setQuestions(shuffledQuestions);
    setStatus('quiz');
  };

  const handleAnswer = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentIdx].correctAnswer) setScore(s => s + 1);
  };

  const nextQuestion = () => {
    setIsAnswered(false);
    setSelectedOption(null);
    if (currentIdx < questions.length - 1) setCurrentIdx(c => c + 1);
    else setStatus('result');
  };

  const reset = () => {
    setStatus('setup');
    setQuestions([]);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {status === 'setup' && (
        <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-200 animate-fade-in">
           <div className="text-center mb-10">
             <div className="inline-flex p-4 bg-indigo-50 rounded-2xl text-indigo-600 mb-4 shadow-sm">
               <BrainCircuit size={40} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 font-heading mb-2">{t("Language Challenge", "언어 능력 챌린지")}</h2>
             <p className="text-slate-500 text-lg">{t("Master local expressions before you land.", "현지 도착 전, 실전 표현을 마스터하세요.")}</p>
           </div>

           <div className="space-y-8">
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{t("Target Region", "목표 지역")}</label>
               <div className="relative group">
                  <Globe className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20}/>
                  <input
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    placeholder={t("e.g. New York, London, Sydney", "예: 뉴욕, 런던, 시드니")}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 focus:bg-white outline-none font-bold text-lg transition-all"
                  />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{t("Difficulty", "난이도")}</label>
                  <div className="relative">
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as QuizDifficulty)}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-800 appearance-none"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Master">Master</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{t("Mode", "모드")}</label>
                   <select
                      value={type}
                      onChange={e => setType(e.target.value as QuizType)}
                      className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-800 appearance-none"
                    >
                      <option value="Vocabulary">{t("Vocabulary", "어휘")}</option>
                      <option value="Sentence">{t("Sentences", "문장")}</option>
                    </select>
                </div>
             </div>

             <button
               onClick={startQuiz}
               disabled={!region}
               className="w-full bg-indigo-600 text-white py-5 rounded-xl font-black text-xl hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
             >
               <Zap fill="currentColor" />
               {t("Start Challenge", "챌린지 시작")}
             </button>
           </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="bg-white p-16 rounded-[2rem] shadow-xl border border-slate-200 text-center flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin h-16 w-16 text-indigo-600 mb-6" />
          <h3 className="text-2xl font-bold text-slate-800 font-heading">{t("Preparing your quiz...", "퀴즈를 생성하고 있습니다...")}</h3>
          <p className="text-slate-500 mt-2 font-medium">{t("Analyzing local dialects in", "다음 지역의 방언 분석 중:")} <span className="text-indigo-600">{region}</span></p>
        </div>
      )}

      {status === 'quiz' && questions.length > 0 && (
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
             <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                <span>Question {currentIdx + 1} / {questions.length}</span>
                <span>{difficulty}</span>
             </div>
             <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div>
             </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative">
            <div className="p-10 text-center border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-3xl font-bold text-slate-900 font-heading leading-snug">
                 {questions[currentIdx].question}
               </h3>
            </div>

            <div className="p-8 space-y-3 bg-white">
               {questions[currentIdx].options?.map((option, idx) => {
                 const isSelected = selectedOption === option;
                 const isCorrect = option === questions[currentIdx].correctAnswer;

                 let btnClass = "bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-[0_4px_0_0_rgb(226,232,240)] hover:shadow-[0_2px_0_0_rgb(226,232,240)] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none";

                 if (isAnswered) {
                   if (isCorrect) btnClass = "bg-emerald-500 border-emerald-600 text-white shadow-none";
                   else if (isSelected && !isCorrect) btnClass = "bg-red-500 border-red-600 text-white shadow-none opacity-50";
                   else btnClass = "bg-slate-100 border-slate-200 text-slate-400 shadow-none";
                 } else if (isSelected) {
                   btnClass = "bg-indigo-500 border-indigo-600 text-white shadow-none";
                 }

                 return (
                   <button
                     key={idx}
                     onClick={() => handleAnswer(option)}
                     disabled={isAnswered}
                     className={`w-full p-5 rounded-2xl font-bold text-lg transition-all flex justify-between items-center ${btnClass}`}
                   >
                     <span>{option}</span>
                     {isAnswered && isCorrect && <CheckCircle2 size={24} className="text-white" />}
                     {isAnswered && isSelected && !isCorrect && <XCircle size={24} className="text-white" />}
                   </button>
                 )
               })}
            </div>

            {isAnswered && (
              <div className="p-8 bg-indigo-50 border-t border-indigo-100 animate-fade-in">
                <div className="flex gap-4 mb-6">
                   <div className="bg-indigo-100 p-2 rounded-lg h-fit"><Zap className="text-indigo-600" size={20}/></div>
                   <div className="text-indigo-900 text-sm leading-relaxed font-medium">
                     <strong className="block mb-1 uppercase text-xs text-indigo-500 tracking-wider">{t("Explanation", "해설")}</strong>
                     {questions[currentIdx].explanation}
                   </div>
                </div>
                <button
                  onClick={nextQuestion}
                  className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-lg hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2"
                >
                  <span>{currentIdx === questions.length - 1 ? t("See Results", "결과 보기") : t("Next Question", "다음 문제")}</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'result' && (
        <div className="bg-white p-12 rounded-[2rem] shadow-2xl border border-slate-200 text-center animate-fade-in max-w-xl mx-auto">
          <div className="inline-flex bg-yellow-400 p-6 rounded-full text-white mb-8 shadow-lg shadow-yellow-200 ring-8 ring-yellow-50">
            <Trophy size={64} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 font-heading mb-2">{t("Quiz Complete!", "시험 종료!")}</h2>

          <div className="my-8 py-8 border-y border-slate-100">
             <div className="text-7xl font-black text-indigo-600 mb-2 tracking-tighter">{score * 20}</div>
             <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t("Total Score", "총점")} / 100</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
             <div className="bg-slate-50 p-4 rounded-2xl">
               <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Correct</span>
               <span className="font-black text-xl text-slate-800">{score} / {questions.length}</span>
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl">
               <span className="block text-xs font-bold text-slate-400 uppercase mb-1">Level</span>
               <span className="font-black text-xl text-slate-800">{difficulty}</span>
             </div>
          </div>

          <button
            onClick={reset}
            className="w-full bg-slate-900 text-white px-8 py-5 rounded-2xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xl"
          >
            <RotateCcw size={20} />
            <span>{t("Try Again", "다시 시도하기")}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageQuiz;
