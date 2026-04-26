'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, CheckSquare, ShieldCheck, DollarSign, MessageCircle, Calendar, GraduationCap, Languages, Bot, BrainCircuit, MessageSquare, LayoutDashboard, ChevronRight, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AppRoute } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  isSub?: boolean;
  onClick?: () => void;
}

const NavItem = ({ href, icon: Icon, label, active, isSub = false, onClick }: NavItemProps) => (
  <Link
    href={href}
    onClick={onClick}
    className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 mb-0.5 ${
      active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    } ${isSub ? 'ml-4' : ''}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg ${active ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'} transition-colors`}>
        <Icon size={isSub ? 16 : 18} className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'} transition-colors`} strokeWidth={2} />
      </div>
      <span className={`font-semibold tracking-tight ${isSub ? 'text-xs' : 'text-[13px]'}`}>{label}</span>
    </div>
    {active && <ChevronRight size={14} className="text-white/70" strokeWidth={2.5} />}
  </Link>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const { language, setLanguage, aiLanguage, setAiLanguage, t } = useLanguage();
  const { user, isLoading, isAuthEnabled, login, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-900 bg-[#f8fafc]">

      {/* Mobile Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 md:hidden flex justify-between items-center sticky top-0 z-20">
         <div className="flex items-center gap-3">
             <button
               onClick={toggleMobileMenu}
               className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
               aria-label="Toggle menu"
             >
                <Menu size={24} />
             </button>
             <Link href={AppRoute.HOME} className="flex items-center space-x-2" onClick={closeMobileMenu}>
                <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-extrabold text-slate-900 font-heading tracking-tight">Abrovia</span>
             </Link>
         </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-[280px] bg-white flex flex-col border-r border-slate-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen md:sticky md:top-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 mb-2 flex items-center justify-between">
          <Link href={AppRoute.HOME} className="flex items-center space-x-3 group cursor-pointer select-none" onClick={closeMobileMenu}>
             <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-all transform group-hover:scale-105 flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" strokeWidth={2.5} />
             </div>
             <div>
                <span className="block text-xl font-extrabold text-slate-900 tracking-tight font-heading group-hover:text-indigo-600 transition-colors">Abrovia</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Study Abroad AI</span>
             </div>
          </Link>
          {/* Close Button (Mobile Only) */}
          <button onClick={closeMobileMenu} className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 space-y-6 flex-1 overflow-y-auto custom-scrollbar py-4">
          <div>
            <NavItem href={AppRoute.HOME} icon={LayoutDashboard} label={t("Dashboard", "대시보드")} active={pathname === AppRoute.HOME} onClick={closeMobileMenu} />
          </div>

          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Preparation", "준비")}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
            </div>
            <div className="space-y-1">
              <NavItem href={AppRoute.RELIABILITY} icon={ShieldCheck} label={t("Reliability Check", "신뢰도 분석")} active={pathname === AppRoute.RELIABILITY} onClick={closeMobileMenu} />
              <NavItem href={AppRoute.DIAGNOSTIC} icon={GraduationCap} label={t("Readiness Test", "준비도 진단")} active={pathname === AppRoute.DIAGNOSTIC} onClick={closeMobileMenu} />
              <NavItem href={AppRoute.CHECKLIST} icon={CheckSquare} label={t("Checklist", "체크리스트")} active={pathname === AppRoute.CHECKLIST} onClick={closeMobileMenu} />
              <NavItem href={AppRoute.BUDGET} icon={DollarSign} label={t("Budget Calculator", "비용 계산기")} active={pathname === AppRoute.BUDGET} onClick={closeMobileMenu} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 px-3 mb-2">
              <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("Training", "훈련")}</span>
              <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
            </div>
            <div className="space-y-1">
              <NavItem href={AppRoute.QUIZ} icon={BrainCircuit} label={t("Language Quiz", "언어 퀴즈")} active={pathname === AppRoute.QUIZ} onClick={closeMobileMenu} />
              <NavItem href={AppRoute.SIMULATOR} icon={MessageSquare} label={t("AI Simulator", "AI 시뮬레이터")} active={pathname === AppRoute.SIMULATOR} onClick={closeMobileMenu} />
              <NavItem href={AppRoute.TRAINER} icon={MessageCircle} label={t("Survival Phrases", "생존 영어")} active={pathname === AppRoute.TRAINER} onClick={closeMobileMenu} />
              <NavItem href={AppRoute.ROUTINE} icon={Calendar} label={t("Routine Designer", "루틴 생성기")} active={pathname === AppRoute.ROUTINE} onClick={closeMobileMenu} />
            </div>
          </div>
        </nav>

        {/* Auth Section */}
        {isAuthEnabled && (
          <div className="px-4 mb-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-3">
                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : user ? (
              <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-3 border border-indigo-100/50">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center shadow-sm overflow-hidden">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name || 'User'} width={36} height={36} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <User size={18} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user.name || user.preferred_username || 'User'}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl text-xs font-semibold transition-all border border-slate-200 hover:border-red-200"
                >
                  <LogOut size={14} />
                  <span>{t('Logout', '로그아웃')}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="w-full flex items-center justify-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-all border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow"
              >
                <Image
                  src="/icons/moring.svg"
                  alt="Moring"
                  width={22}
                  height={22}
                  className="mr-2.5"
                />
                <span>{t('Login with Moring', 'Moring 로그인')}</span>
              </button>
            )}
          </div>
        )}

        <div className="p-3 mx-3 mb-3 bg-slate-50/80 rounded-2xl">
           <div className="space-y-2">
             {/* UI Language */}
             <div className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-white transition-colors">
               <div className="flex items-center gap-2.5 text-slate-600">
                  <Languages size={15} className="text-slate-400"/>
                  <span className="text-xs font-semibold">{t('Language', '언어')}</span>
               </div>
               <select
                 value={language}
                 onChange={(e) => setLanguage(e.target.value as 'ko' | 'en')}
                 className="bg-transparent text-xs text-slate-600 font-semibold focus:outline-none text-right cursor-pointer hover:text-indigo-600 transition-colors"
               >
                 <option value="ko">한국어</option>
                 <option value="en">English</option>
               </select>
             </div>

             {/* AI Language */}
             <div className="flex items-center justify-between group px-2 py-1.5 rounded-lg hover:bg-white transition-colors">
               <div className="flex items-center gap-2.5 text-slate-600">
                  <Bot size={15} className="text-slate-400" />
                  <span className="text-xs font-semibold">{t('AI Response', 'AI 응답')}</span>
               </div>
               <select
                 value={aiLanguage}
                 onChange={(e) => setAiLanguage(e.target.value as 'ko' | 'en')}
                 className="bg-transparent text-xs text-slate-600 font-semibold focus:outline-none text-right cursor-pointer hover:text-indigo-600 transition-colors"
               >
                 <option value="ko">한국어</option>
                 <option value="en">English</option>
               </select>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#f8fafc]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 lg:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto w-full pb-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
