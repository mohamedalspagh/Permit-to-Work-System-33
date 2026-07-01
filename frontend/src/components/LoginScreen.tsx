/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Factory, Lock, ArrowRight, Activity, ShieldAlert, Globe } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { t, getLocalizedValue } from '../utils/translations';
import { DEFAULT_TENANTS, getTenantFeatureHints, getTenantPlanLabel } from '../utils/saas';

interface LoginScreenProps {
  users: UserProfile[];
  onLogin: (user: UserProfile) => void;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
}

export function LoginScreen({ users, onLogin, language, onLanguageChange }: LoginScreenProps) {
  const [employeeId, setEmployeeId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      const matchedUser = users.find(
        (u) => 
          (u.empCode.toUpperCase() === employeeId.toUpperCase().trim() || 
           u.username.toLowerCase() === employeeId.toLowerCase().trim()) && 
          u.password === password
      );
      
      if (matchedUser) {
        onLogin(matchedUser);
        return;
      }
      
      setError(t('Invalid Employee ID or password', language));
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-neutral-950 flex flex-col font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] rounded-full bg-orange-500/5 blur-3xl absolute -top-1/4 -right-1/4" />
        <div className="w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] rounded-full bg-blue-500/5 blur-3xl absolute -bottom-1/4 -left-1/4" />
      </div>

      {/* Header */}
      <header className="bg-[#0F172A] border-b border-slate-700 py-4 px-6 shadow-md text-white z-10 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-9 h-9 bg-orange-500 rounded flex items-center justify-center font-bold text-lg text-white shadow-inner flex-shrink-0">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div className={language === 'ar' ? 'text-right' : 'text-left'}>
              <h1 className={`text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                <span>{t("CementMaster PTW", language)}</span>
                <span className="text-orange-500">|</span>
                <span className="text-xs font-semibold text-slate-400">{t("Operations Hub", language)}</span>
              </h1>
            </div>
          </div>

          {/* Language selection dropdown/toggle on the top-right */}
          {onLanguageChange && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onLanguageChange('ar')}
                className={`px-2 py-1 text-xs rounded transition-all font-bold ${language === 'ar' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-xs rounded transition-all font-bold ${language === 'en' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('zh')}
                className={`px-2 py-1 text-xs rounded transition-all font-bold ${language === 'zh' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                中文
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Login Form */}
      <main className="flex-1 flex items-center justify-center p-4 z-10 relative">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-8">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                {t('System Login', language)}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('Please enter your employee ID and password', language)}
              </p>
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-950/50">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <span>Multi-tenant SaaS access</span>
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                    {getTenantPlanLabel(DEFAULT_TENANTS[0])}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {getTenantFeatureHints(DEFAULT_TENANTS[0]).map((hint) => (
                    <li key={hint} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                  {t('Employee ID or Username', language)}
                </label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 dark:text-white transition-colors text-sm font-sans"
                  placeholder={t('e.g. admin or EMP101', language)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('Password', language)}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-slate-900 dark:text-white transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                  <span className="text-slate-600 dark:text-slate-400">{t('Remember me', language)}</span>
                </label>
                <a href="#" className="text-orange-600 dark:text-orange-400 font-medium hover:underline">
                  {t('Forgot password?', language)}
                </a>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-3 py-2 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{t('Access Control Hub', language)}</span>
                    <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center animate-fade-in">
              <h3 className="text-xs font-bold text-slate-500 mb-3 text-center uppercase tracking-wider">
                {t('Quick Demo Logins for Evaluation', language)}
              </h3>
              <div className="grid grid-cols-2 xs:grid-cols-3 gap-2 mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {users.slice(0, 6).map((u) => {
                  let badgeLabel = 'موظف';
                  if (u.username === 'admin') {
                    badgeLabel = language === 'ar' ? '👑 مدير النظام' : (language === 'zh' ? '👑 系统管理员' : '👑 System Admin');
                  } else if (u.customRole === 'SAFETY_MANAGER') {
                    badgeLabel = language === 'ar' ? 'مدير سيفيتي' : (language === 'zh' ? '安全总监' : 'Safety Manager');
                  } else if (u.customRole === 'SAFETY_SUPERVISOR') {
                    badgeLabel = language === 'ar' ? 'مشرف سيفيتي' : (language === 'zh' ? '安全员' : 'Safety Supervisor');
                  } else if (u.sandboxRole === 'PRODUCTION') {
                    badgeLabel = language === 'ar' ? 'الإنتاج' : (language === 'zh' ? '生产部' : 'Production');
                  } else if (u.sandboxRole === 'ELECTRICAL') {
                    badgeLabel = language === 'ar' ? 'الكهرباء' : (language === 'zh' ? '电气部' : 'Electrical');
                  } else {
                    badgeLabel = language === 'ar' ? 'موظف' : (language === 'zh' ? '申请人' : 'Requester');
                  }
                  
                  return (
                    <div 
                      key={u.empCode} 
                      onClick={() => { setEmployeeId(u.username); setPassword(u.password); }} 
                      className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded p-1.5 text-[11px] text-center cursor-pointer hover:border-orange-500 hover:text-orange-500 transition-all shadow-sm"
                    >
                      <strong className="block text-slate-700 dark:text-slate-300 font-mono text-[10px]">@{u.username}</strong>
                      <span className="text-[9px] text-slate-400 block truncate mt-0.5" title={getLocalizedValue(language, u.fullNameEn, u.fullNameAr, u.fullNameZh)}>
                        {getLocalizedValue(language, u.fullNameEn, u.fullNameAr, u.fullNameZh).split(' ')[0]}
                      </span>
                      <span className="text-[8px] px-1 bg-slate-200/50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-sm font-semibold mt-1 inline-block">
                        {badgeLabel}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <ShieldAlert className="w-4 h-4" />
                <span>{t('Secure login, audited for safety compliance', language)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
