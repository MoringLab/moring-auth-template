'use client';

import Link from 'next/link';
import { ShieldCheck, GraduationCap, CheckSquare, MessageCircle, DollarSign, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { AppRoute } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';

interface BentoItemProps {
  href: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  size?: 'small' | 'large';
}

const BentoItem = ({ href, icon: Icon, title, desc, color, size = 'small' }: BentoItemProps) => {
  const isLarge = size === 'large';
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300 p-6 flex flex-col justify-between ${isLarge ? 'md:col-span-2 md:row-span-2 min-h-[280px]' : 'min-h-[200px]'}`}
    >
      <div className={`absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full opacity-10 ${color} blur-2xl group-hover:opacity-20 transition-opacity`}></div>

      <div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className={`font-bold text-slate-800 mb-2 font-heading ${isLarge ? 'text-2xl' : 'text-lg'}`}>{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
      </div>

      <div className="mt-4 flex items-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
        <span className="mr-2">Start Now</span>
        <ArrowRight size={16} />
      </div>
    </Link>
  );
};

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <div className="relative bg-[#0f172a] rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-6 border border-white/10">
             <Sparkles size={12} />
             <span>AI Study Abroad Assistant</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight font-heading leading-tight">
            {t("Your Study Abroad", "유학 준비,")} <br/>
            <span className="text-indigo-400">{t("Supercharged.", "AI와 함께 완벽하게.")}</span>
          </h1>
          <p className="text-lg text-slate-300 mb-8 max-w-xl leading-relaxed">
            {t(
              "Analyze programs for risks, practice language skills with AI, and generate personalized checklists in seconds.",
              "프로그램 위험 분석부터 AI 회화 연습, 맞춤형 체크리스트 생성까지. 단기 유학의 모든 과정을 가장 스마트하게 준비하세요."
            )}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={AppRoute.RELIABILITY} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/50 flex items-center gap-2">
              <ShieldCheck size={20} />
              <span>{t("Check Reliability", "신뢰도 분석하기")}</span>
            </Link>
            <Link href={AppRoute.SIMULATOR} className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold backdrop-blur-md border border-white/10 transition-all flex items-center gap-2">
              <MessageCircle size={20} />
              <span>{t("Start Simulation", "시뮬레이션 시작")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 px-2 font-heading">{t("Tools Dashboard", "스마트 도구 모음")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Large Item */}
          <BentoItem
            size="large"
            href={AppRoute.SIMULATOR}
            icon={MessageCircle}
            color="bg-indigo-600"
            title={t("AI Roleplay Simulator", "실전 AI 시뮬레이터")}
            desc={t("Immerse yourself in real-life scenarios. Chat with AI host parents, teachers, and friends to build confidence before you leave.", "현지 상황에 미리 몰입해보세요. AI 호스트맘, 선생님과 대화하며 실전 감각을 극대화합니다.")}
          />

          <BentoItem
            href={AppRoute.RELIABILITY}
            icon={ShieldCheck}
            color="bg-emerald-600"
            title={t("Reliability Audit", "신뢰도 감사")}
            desc={t("Detect hidden costs & risks in brochures.", "브로셔의 숨겨진 비용과 위험 요소를 즉시 감지합니다.")}
          />
          <BentoItem
            href={AppRoute.DIAGNOSTIC}
            icon={GraduationCap}
            color="bg-blue-600"
            title={t("Readiness Test", "준비도 진단")}
            desc={t("Assess mental & practical readiness.", "심리적, 실질적 준비 상태를 정밀 진단합니다.")}
          />
          <BentoItem
            href={AppRoute.CHECKLIST}
            icon={CheckSquare}
            color="bg-teal-500"
            title={t("Smart Checklist", "스마트 체크리스트")}
            desc={t("Auto-generated packing list.", "목적지와 기간에 딱 맞는 준비물을 생성합니다.")}
          />
          <BentoItem
            href={AppRoute.BUDGET}
            icon={DollarSign}
            color="bg-orange-500"
            title={t("Budget Estimator", "비용 예측기")}
            desc={t("Data-driven cost calculation.", "데이터 기반으로 정확한 예상 비용을 산출합니다.")}
          />
          <BentoItem
             href={AppRoute.ROUTINE}
             icon={Calendar}
             color="bg-violet-600"
             title={t("Routine Planner", "루틴 플래너")}
             desc={t("Design your 5-week success schedule.", "5주 완성 성공 루틴을 설계하세요.")}
          />
           <BentoItem
             href={AppRoute.TRAINER}
             icon={Sparkles}
             color="bg-pink-500"
             title={t("Survival Phrases", "생존 영어")}
             desc={t("Master essential phrases for any situation.", "어떤 상황에서도 당황하지 않는 필수 표현 마스터.")}
          />
        </div>
      </div>
    </div>
  );
}
