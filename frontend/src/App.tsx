/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Permit, SandboxRole, Incident, HiraAssessment, SafetyAudit, TrainingRecord, UserProfile, Language } from './types';
import { USER_PROFILES } from './utils/initialData';
import { t, getLocalizedValue } from './utils/translations';
import { 
  INITIAL_PERMITS_SEED, 
  INITIAL_INCIDENTS, 
  INITIAL_HIRAS, 
  INITIAL_AUDITS, 
  INITIAL_TRAINING 
} from './utils/initialEhsData';
import { Dashboard } from './components/Dashboard';
import { PermitDetail } from './components/PermitDetail';
import { PermitForm } from './components/PermitForm';
import { LoginScreen } from './components/LoginScreen';
import { NotificationsPanel } from './components/NotificationsPanel';
import { UserManager } from './components/UserManager';
import { PushNotificationService } from './utils/pushNotificationService';
import { DeviceNotificationOverlay } from './components/DeviceNotificationOverlay';

// Core EHS Modules
import { IncidentManager } from './components/IncidentManager';
import { HiraManager } from './components/HiraManager';
import { AuditManager } from './components/AuditManager';
import { TrainingManager } from './components/TrainingManager';
import { SafetyAiCopilot } from './components/SafetyAiCopilot';
import { PlatformPerformance } from './components/PlatformPerformance';

// Firebase Helpers
import {
  isFirebaseConfigured,
  dbGetUsers,
  dbSaveUser,
  dbSaveUsersBatch,
  dbDeleteUser,
  dbGetPermits,
  dbSavePermit,
  dbSavePermitsBatch,
  dbDeletePermit,
  dbGetIncidents,
  dbSaveIncident,
  dbSaveIncidentsBatch,
  dbDeleteIncident,
  dbGetHiras,
  dbSaveHira,
  dbSaveHirasBatch,
  dbDeleteHira,
  dbGetAudits,
  dbSaveAudit,
  dbSaveAuditsBatch,
  dbDeleteAudit,
  dbGetTrainings,
  dbSaveTraining,
  dbSaveTrainingsBatch,
  dbDeleteTraining
} from "./utils/firebase";


import { 
  ShieldAlert, Wrench, Factory, Activity, CheckCircle, 
  Clock, Flame, Construction, HelpCircle, FileStack, LogOut, Globe,
  Shield, ClipboardCheck, GraduationCap, Brain, Users
} from 'lucide-react';
import { motion } from 'motion/react';

type EhsTab = 'PERMITS' | 'INCIDENTS' | 'HIRA' | 'AUDITS' | 'TRAINING' | 'AI_COPILOT' | 'USERS' | 'PERFORMANCE';

const DEFAULT_USERS_SEED: UserProfile[] = [
  {
    empCode: 'ADMIN01',
    password: 'admin',
    sandboxRole: 'HSE',
    customRole: 'SAFETY_MANAGER',
    username: 'admin',
    fullNameAr: 'مدير النظام (admin)',
    fullNameEn: 'System Administrator (admin)',
    roleAr: 'مدير النظام',
    roleEn: 'System Administrator',
    departmentAr: 'إدارة السلامة والصحة المهنية',
    departmentEn: 'Safety & Occupational Health Administration (HSE)',
    canCreatePermit: true,
    canApproveElectrical: true,
    canApproveProduction: true,
    canApproveSafety: true
  },
  {
    empCode: 'EMP101',
    password: '123',
    sandboxRole: 'REQUESTER',
    customRole: 'EMPLOYEE',
    username: 'ahmad_eng',
    fullNameAr: 'م. أحمد المنفذ',
    fullNameEn: 'Eng. Ahmed Al-Monafed',
    roleAr: 'مشرف الفريق المنفذ',
    roleEn: 'Maintenance Engineer',
    departmentAr: 'إدارة الصيانة',
    departmentEn: 'Maintenance Administration'
  },
  {
    empCode: 'EMP102',
    password: '123',
    sandboxRole: 'PRODUCTION',
    customRole: 'PRODUCTION_DEPT',
    username: 'turki_prod',
    fullNameAr: 'م. تركي اليوسف',
    fullNameEn: 'Eng. Turki Al-Yousef',
    roleAr: 'مدير إدارة التشغيل والتحكم (الإنتاج)',
    roleEn: 'Production Manager',
    departmentAr: 'إدارة الإنتاج والتشغيل',
    departmentEn: 'Production & Operations Administration'
  },
  {
    empCode: 'EMP103',
    password: '123',
    sandboxRole: 'ELECTRICAL',
    customRole: 'ELECTRICAL_DEPT',
    username: 'ali_elec',
    fullNameAr: 'م. علي عبد الله',
    fullNameEn: 'Eng. Ali Abdullah',
    roleAr: 'رئيس إدارة الكهرباء والـ LOTO',
    roleEn: 'Electrical Manager',
    departmentAr: 'إدارة الكهرباء',
    departmentEn: 'Electrical Administration'
  },
  {
    empCode: 'EMP104',
    password: '123',
    sandboxRole: 'HSE',
    customRole: 'SAFETY_SUPERVISOR',
    username: 'asaad_hse',
    fullNameAr: 'م. أسعد الشمراني',
    fullNameEn: 'Eng. Asaad Al-Shamrani',
    roleAr: 'مشرف سيفيتي (HSE Inspector)',
    roleEn: 'HSE Safety Supervisor',
    departmentAr: 'إدارة السلامة والصحة المهنية',
    departmentEn: 'Safety & Occupational Health Administration (HSE)'
  },
  {
    empCode: 'EMP105',
    password: '123',
    sandboxRole: 'HSE',
    customRole: 'SAFETY_MANAGER',
    username: 'samer_mgr',
    fullNameAr: 'م. سامر الأحمد',
    fullNameEn: 'Eng. Samer Al-Ahmad',
    roleAr: 'مدير سيفيتي المعتمد (HSE Manager)',
    roleEn: 'EHS Safety Manager',
    departmentAr: 'إدارة السلامة والصحة المهنية',
    departmentEn: 'Safety & Occupational Health Administration (HSE)'
  }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState<boolean>(false);
  const [permits, setPermits] = React.useState<Permit[]>([]);
  const [selectedPermitId, setSelectedPermitId] = React.useState<string | null>(null);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = React.useState<UserProfile>({
    empCode: 'EMP101',
    password: '123',
    sandboxRole: 'REQUESTER',
    customRole: 'EMPLOYEE',
    username: 'ahmad_eng',
    fullNameAr: 'م. أحمد المنفذ',
    fullNameEn: 'Eng. Ahmed Al-Monafed',
    roleAr: 'مشرف الفريق المنفذ',
    roleEn: 'Maintenance Engineer',
    departmentAr: 'إدارة الصيانة',
    departmentEn: 'Maintenance Administration'
  });
  const [currentRole, setCurrentRole] = React.useState<SandboxRole>('REQUESTER');
  const [language, setLanguage] = React.useState<Language>('ar');
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [currentTime, setCurrentTime] = React.useState<string>('');

  // Added EHS Module Persistence States
  const [activeTab, setActiveTab] = React.useState<EhsTab>('PERMITS');
  const [incidents, setIncidents] = React.useState<Incident[]>([]);
  const [hiras, setHiras] = React.useState<HiraAssessment[]>([]);
  const [audits, setAudits] = React.useState<SafetyAudit[]>([]);
  const [trainings, setTrainings] = React.useState<TrainingRecord[]>([]);

  // Register active user to push notifications service
  React.useEffect(() => {
    if (isLoggedIn && currentUser) {
      PushNotificationService.subscribeUser(
        currentUser.empCode, 
        currentUser.username, 
        currentUser.roleEn || '', 
        currentUser.roleAr || ''
      );
      
      // Proactively request browser native notification permission
      PushNotificationService.requestPermission();
    }
  }, [isLoggedIn, currentUser]);

  const handleAutoSwitchUser = (targetUser: UserProfile, permitId: string) => {
    // Switch the logged-in user profile & role
    setCurrentUser(targetUser);
    setCurrentRole(targetUser.sandboxRole || 'REQUESTER');
    
    // Switch view context directly to the targeted permit
    setIsCreating(false);
    setActiveTab('PERMITS');
    setSelectedPermitId(permitId);
  };

  // 1. Initial State Loading & Storage Sync (EHS Enhanced)
  React.useEffect(() => {
    async function initData() {
      if (isFirebaseConfigured) {
        try {
          const dbUsers = await dbGetUsers();
          const dbPermits = await dbGetPermits();
          const dbIncidents = await dbGetIncidents();
          const dbHiras = await dbGetHiras();
          const dbAudits = await dbGetAudits();
          const dbTrainings = await dbGetTrainings();

          if (dbUsers) {
            let userList = dbUsers;
            if (userList.length === 0) {
              userList = DEFAULT_USERS_SEED;
              await dbSaveUsersBatch(DEFAULT_USERS_SEED);
            }
            setUsers(userList);
            localStorage.setItem('ehs_users_v3', JSON.stringify(userList));
          } else {
            loadUsersFromLocalStorage();
          }

          if (dbPermits) {
            let permitList = dbPermits;
            if (permitList.length === 0) {
              permitList = INITIAL_PERMITS_SEED;
              await dbSavePermitsBatch(INITIAL_PERMITS_SEED);
            }
            setPermits(permitList);
            localStorage.setItem('ptw_records_v3', JSON.stringify(permitList));
          } else {
            loadPermitsFromLocalStorage();
          }

          if (dbIncidents) {
            let incidentList = dbIncidents;
            if (incidentList.length === 0) {
              incidentList = INITIAL_INCIDENTS;
              await dbSaveIncidentsBatch(INITIAL_INCIDENTS);
            }
            setIncidents(incidentList);
            localStorage.setItem('ehs_incidents_v3', JSON.stringify(incidentList));
          } else {
            loadIncidentsFromLocalStorage();
          }

          if (dbHiras) {
            let hiraList = dbHiras;
            if (hiraList.length === 0) {
              hiraList = INITIAL_HIRAS;
              await dbSaveHirasBatch(INITIAL_HIRAS);
            }
            setHiras(hiraList);
            localStorage.setItem('ehs_hiras_v3', JSON.stringify(hiraList));
          } else {
            loadHirasFromLocalStorage();
          }

          if (dbAudits) {
            let auditList = dbAudits;
            if (auditList.length === 0) {
              auditList = INITIAL_AUDITS;
              await dbSaveAuditsBatch(INITIAL_AUDITS);
            }
            setAudits(auditList);
            localStorage.setItem('ehs_audits_v3', JSON.stringify(auditList));
          } else {
            loadAuditsFromLocalStorage();
          }

          if (dbTrainings) {
            let trainingList = dbTrainings;
            if (trainingList.length === 0) {
              trainingList = INITIAL_TRAINING;
              await dbSaveTrainingsBatch(INITIAL_TRAINING);
            }
            setTrainings(trainingList);
            localStorage.setItem('ehs_trainings_v3', JSON.stringify(trainingList));
          } else {
            loadTrainingsFromLocalStorage();
          }
        } catch (error) {
          console.error("Failed to load Firebase data, falling back to localStorage", error);
          loadAllFromLocalStorage();
        }
      } else {
        loadAllFromLocalStorage();
      }
    }

    function loadUsersFromLocalStorage() {
      const storedUsers = localStorage.getItem('ehs_users_v3');
      if (storedUsers) {
        try {
          let parsed = JSON.parse(storedUsers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let upgraded = false;
            parsed = parsed.map(user => {
              const updatedUser = { ...user };
              if (updatedUser.departmentAr && (
                updatedUser.departmentAr.includes('القسم') || 
                updatedUser.departmentAr.includes('قسم') ||
                updatedUser.departmentAr === 'الإنتاج والتشغيل' ||
                updatedUser.departmentAr === 'الكهرباء والطاقة' ||
                updatedUser.departmentAr === 'السلامة والصحة المهنية'
              )) {
                upgraded = true;
                if (updatedUser.departmentAr.includes('الهندسي') || updatedUser.departmentAr.includes('ميكانيكا')) {
                  updatedUser.departmentAr = 'إدارة الصيانة';
                  updatedUser.departmentEn = 'Maintenance Administration';
                } else if (updatedUser.departmentAr.includes('الإنتاج') || updatedUser.departmentAr.includes('تشغيل')) {
                  updatedUser.departmentAr = 'إدارة الإنتاج والتشغيل';
                  updatedUser.departmentEn = 'Production & Operations Administration';
                } else if (updatedUser.departmentAr.includes('الكهرباء')) {
                  updatedUser.departmentAr = 'إدارة الكهرباء';
                  updatedUser.departmentEn = 'Electrical Administration';
                  if (updatedUser.roleAr) {
                    updatedUser.roleAr = updatedUser.roleAr.replace('رئيس قسم الكهرباء', 'رئيس إدارة الكهرباء');
                  }
                } else if (updatedUser.departmentAr.includes('السلامة')) {
                  updatedUser.departmentAr = 'إدارة السلامة والصحة المهنية';
                  updatedUser.departmentEn = 'Safety & Occupational Health Administration (HSE)';
                } else {
                  updatedUser.departmentAr = updatedUser.departmentAr.replace(/قسم\s*/, 'إدارة ');
                }
              }
              return updatedUser;
            });
            const hasAdmin = parsed.some((u: any) => u.username === 'admin');
            if (!hasAdmin) {
              parsed.unshift({
                empCode: 'ADMIN01',
                password: 'admin',
                sandboxRole: 'HSE',
                customRole: 'SAFETY_MANAGER',
                username: 'admin',
                fullNameAr: 'مدير النظام (admin)',
                fullNameEn: 'System Administrator (admin)',
                roleAr: 'مدير النظام',
                roleEn: 'System Administrator',
                departmentAr: 'إدارة السلامة والصحة المهنية',
                departmentEn: 'Safety & Occupational Health Administration (HSE)',
                canCreatePermit: true,
                canApproveElectrical: true,
                canApproveProduction: true,
                canApproveSafety: true
              });
              upgraded = true;
            }
            if (upgraded) {
              localStorage.setItem('ehs_users_v3', JSON.stringify(parsed));
            }
            setUsers(parsed);
          } else {
            setUsers(DEFAULT_USERS_SEED);
          }
        } catch (e) {
          setUsers(DEFAULT_USERS_SEED);
        }
      } else {
        setUsers(DEFAULT_USERS_SEED);
        localStorage.setItem('ehs_users_v3', JSON.stringify(DEFAULT_USERS_SEED));
      }
    }

    function loadPermitsFromLocalStorage() {
      const storedPermits = localStorage.getItem('ptw_records_v3');
      if (storedPermits) {
        try {
          const parsed = JSON.parse(storedPermits);
          setPermits(Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_PERMITS_SEED);
        } catch (e) {
          setPermits(INITIAL_PERMITS_SEED);
        }
      } else {
        setPermits(INITIAL_PERMITS_SEED);
        localStorage.setItem('ptw_records_v3', JSON.stringify(INITIAL_PERMITS_SEED));
      }
    }

    function loadIncidentsFromLocalStorage() {
      const storedInc = localStorage.getItem('ehs_incidents_v3');
      if (storedInc) {
        try { getAndSetCollection(storedInc, setIncidents, INITIAL_INCIDENTS); } catch (e) { setIncidents(INITIAL_INCIDENTS); }
      } else {
        setIncidents(INITIAL_INCIDENTS);
        localStorage.setItem('ehs_incidents_v3', JSON.stringify(INITIAL_INCIDENTS));
      }
    }

    function loadHirasFromLocalStorage() {
      const storedHiras = localStorage.getItem('ehs_hiras_v3');
      if (storedHiras) {
        try { getAndSetCollection(storedHiras, setHiras, INITIAL_HIRAS); } catch (e) { setHiras(INITIAL_HIRAS); }
      } else {
        setHiras(INITIAL_HIRAS);
        localStorage.setItem('ehs_hiras_v3', JSON.stringify(INITIAL_HIRAS));
      }
    }

    function loadAuditsFromLocalStorage() {
      const storedAudits = localStorage.getItem('ehs_audits_v3');
      if (storedAudits) {
        try { getAndSetCollection(storedAudits, setAudits, INITIAL_AUDITS); } catch (e) { setAudits(INITIAL_AUDITS); }
      } else {
        setAudits(INITIAL_AUDITS);
        localStorage.setItem('ehs_audits_v3', JSON.stringify(INITIAL_AUDITS));
      }
    }

    function loadTrainingsFromLocalStorage() {
      const storedTrainings = localStorage.getItem('ehs_trainings_v3');
      if (storedTrainings) {
        try { getAndSetCollection(storedTrainings, setTrainings, INITIAL_TRAINING); } catch (e) { setTrainings(INITIAL_TRAINING); }
      } else {
        setTrainings(INITIAL_TRAINING);
        localStorage.setItem('ehs_trainings_v3', JSON.stringify(INITIAL_TRAINING));
      }
    }

    function loadAllFromLocalStorage() {
      loadUsersFromLocalStorage();
      loadPermitsFromLocalStorage();
      loadIncidentsFromLocalStorage();
      loadHirasFromLocalStorage();
      loadAuditsFromLocalStorage();
      loadTrainingsFromLocalStorage();
    }

    function getAndSetCollection(jsonStr: string, setter: Function, fallback: any[]) {
      const parsed = JSON.parse(jsonStr);
      setter(Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback);
    }

    initData();

    // Set time clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('ar-SA', { hour12: false }) + ' (UTC)');
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // Secure redirect: Prevent non-admin users from accessing the USERS tab
  React.useEffect(() => {
    if (activeTab === 'USERS' && (!currentUser || currentUser.username !== 'admin')) {
      setActiveTab('PERMITS');
    }
  }, [activeTab, currentUser]);

  // Sync state mutations to local storage
  // Dynamic User updaters
  const handleAddUser = (newUser: UserProfile) => {
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('ehs_users_v3', JSON.stringify(updated));
    dbSaveUser(newUser);
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    const updated = users.map(u => u.empCode === updatedUser.empCode ? updatedUser : u);
    setUsers(updated);
    localStorage.setItem('ehs_users_v3', JSON.stringify(updated));
    dbSaveUser(updatedUser);
    
    // If we updated the currently logged in user, refresh their record
    if (currentUser && currentUser.empCode === updatedUser.empCode) {
      setCurrentUser(updatedUser);
      localStorage.setItem('ehs_active_user_v3', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (empCode: string) => {
    const updated = users.filter(u => u.empCode !== empCode);
    setUsers(updated);
    localStorage.setItem('ehs_users_v3', JSON.stringify(updated));
    dbDeleteUser(empCode);
  };

  const savePermitsState = (updatedList: Permit[]) => {
    setPermits(updatedList);
    localStorage.setItem('ptw_records_v3', JSON.stringify(updatedList));
  };

  const saveIncidentsState = (updated: Incident[]) => {
    setIncidents(updated);
    localStorage.setItem('ehs_incidents_v3', JSON.stringify(updated));
  };

  const saveHirasState = (updated: HiraAssessment[]) => {
    setHiras(updated);
    localStorage.setItem('ehs_hiras_v3', JSON.stringify(updated));
  };

  const saveAuditsState = (updated: SafetyAudit[]) => {
    setAudits(updated);
    localStorage.setItem('ehs_audits_v3', JSON.stringify(updated));
  };

  const saveTrainingsState = (updated: TrainingRecord[]) => {
    setTrainings(updated);
    localStorage.setItem('ehs_trainings_v3', JSON.stringify(updated));
  };

  // Updaters for newly integrated modules
  const handleAddIncident = (newInc: Incident) => {
    const list = [newInc, ...incidents];
    saveIncidentsState(list);
    dbSaveIncident(newInc);
  };

  const handleUpdateIncident = (updated: Incident) => {
    const list = incidents.map(i => i.id === updated.id ? updated : i);
    saveIncidentsState(list);
    dbSaveIncident(updated);
  };

  const handleDeleteIncident = (id: string) => {
    const list = incidents.filter(i => i.id !== id);
    saveIncidentsState(list);
    dbDeleteIncident(id);
  };

  const handleAddHira = (newHira: HiraAssessment) => {
    const list = [newHira, ...hiras];
    saveHirasState(list);
    dbSaveHira(newHira);
  };

  const handleUpdateHira = (updated: HiraAssessment) => {
    const list = hiras.map(h => h.id === updated.id ? updated : h);
    saveHirasState(list);
    dbSaveHira(updated);
  };

  const handleDeleteHira = (id: string) => {
    const list = hiras.filter(h => h.id !== id);
    saveHirasState(list);
    dbDeleteHira(id);
  };

  const handleAddAudit = (newAudit: SafetyAudit) => {
    const list = [newAudit, ...audits];
    saveAuditsState(list);
    dbSaveAudit(newAudit);
  };

  const handleUpdateAudit = (updated: SafetyAudit) => {
    const list = audits.map(a => a.id === updated.id ? updated : a);
    saveAuditsState(list);
    dbSaveAudit(updated);
  };

  const handleAddTraining = (newTr: TrainingRecord) => {
    const list = [newTr, ...trainings];
    saveTrainingsState(list);
    dbSaveTraining(newTr);
  };

  // Updaters (Existing Permits)
  const handleUpdatePermit = (updatedPermit: Permit) => {
    const newList = permits.map(p => p.id === updatedPermit.id ? updatedPermit : p);
    savePermitsState(newList);
    dbSavePermit(updatedPermit);
  };

  const handleCreateDraft = (newPermit: Permit) => {
    const newList = [newPermit, ...permits];
    savePermitsState(newList);
    dbSavePermit(newPermit);
    setIsCreating(false);
    setSelectedPermitId(newPermit.id); // Open it immediately in detailed review
  };

  const handleDeletePermit = (id: string) => {
    const newList = permits.filter(p => p.id !== id);
    savePermitsState(newList);
    dbDeletePermit(id);
    setSelectedPermitId(null);
  };

  // Find currently selected permit
  const activePermit = permits.find(p => p.id === selectedPermitId);

  // Stats calculation
  const totalCount = permits.length;
  const activeCount = permits.filter(p => p.status === 'ACTIVE').length;
  const closedCount = permits.filter(p => p.status === 'CLOSED').length;
  const pendingCount = permits.filter(p => p.status === 'PENDING_DEPT' || p.status === 'HSE_REVIEW').length;

  const getCurrentMonthIncidentsCount = () => {
    const d = new Date();
    const currentMonthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return incidents.filter(inc => {
      const isMine = inc.reportedByEmpCode === currentUser?.empCode || 
                     inc.reportedByName === currentUser?.fullNameEn || 
                     inc.reportedByName === currentUser?.fullNameAr;
      const isInCurrentMonth = inc.date && inc.date.startsWith(currentMonthPrefix);
      return isMine && isInCurrentMonth;
    }).length;
  };

  const activeProfile = currentUser;
  const initialsEn = activeProfile.fullNameEn
    .split(' ')
    .map(n => n.replace(/[^a-zA-Z]/g, '')[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (!isLoggedIn) {
    return (
      <LoginScreen 
        users={users.length > 0 ? users : DEFAULT_USERS_SEED}
        onLogin={(user) => {
          setCurrentUser(user);
          setCurrentRole(user.sandboxRole || 'REQUESTER');
          setIsLoggedIn(true);
          if (user.username !== 'admin') {
            setActiveTab('PERMITS');
          }
        }} 
        language={language} 
        onLanguageChange={setLanguage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-neutral-950 text-slate-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* SECTION 1: INDUSTRIAL BRAND HEADER WITH PROFESSIONAL POLISH THEME */}
      <header id="app-brand-header" className="bg-[#0F172A] border-b border-slate-700 py-4 px-6 shadow-md text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Corporate Title */}
          <div className={`flex items-center gap-3 ${language === 'ar' ? 'md:flex-row-reverse text-right' : 'md:flex-row text-left'}`}>
            <div className="w-9 h-9 bg-orange-500 rounded flex items-center justify-center font-bold text-lg text-white shadow-inner flex-shrink-0 animate-pulse">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 id="header-main-title" className={`text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                <span>{t("CementMaster PTW", language)}</span>
                <span className="text-orange-500">|</span>
                <span className="text-xs font-semibold text-slate-400">{t("Operations Hub", language)}</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium mt-0.5">
                {language === 'ar' 
                  ? 'بوابة السلامة الميدانية وتصاريح العمل وعزل الطاقة والغازات'
                  : (language === 'zh' ? '现场安全准入、工作许可与上锁挂牌能源隔离监控系统' : 'Safety & Work Control Management System')}
              </p>
            </div>
          </div>

          {/* Core Analytics Quick Metrics from the Theme */}
          <div className="hidden lg:flex gap-5 border-l border-slate-700 pl-5 pr-5 border-r">
            <div className="text-center min-w-10">
              <div className="text-orange-400 font-bold text-sm leading-tight font-mono">{activeCount}</div>
              <div className="text-[9px] text-slate-400 uppercase font-medium">{t("Active", language)}</div>
            </div>
            <div className="text-center min-w-10">
              <div className="text-blue-400 font-bold text-sm leading-tight font-mono">{closedCount}</div>
              <div className="text-[9px] text-slate-400 uppercase font-medium">{t("Closed", language)}</div>
            </div>
            <div className="text-center min-w-10">
              <div className="text-red-400 font-bold text-sm leading-tight font-mono">{pendingCount}</div>
              <div className="text-[9px] text-slate-400 uppercase font-medium">{t("Urgent", language)}</div>
            </div>
            <div className="text-center min-w-14 px-2 border-l border-slate-700">
              <div className="text-amber-400 font-bold text-sm leading-tight font-mono animate-pulse">{getCurrentMonthIncidentsCount()}</div>
              <div className="text-[9px] text-amber-500 uppercase font-medium">{t("My Reports/Mo", language)}</div>
            </div>
          </div>

          {/* Active simulated bio with dynamic details and initials circle avatar */}
          <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white transition-opacity duration-150">
                {getLocalizedValue(language, activeProfile.fullNameEn, activeProfile.fullNameAr, activeProfile.fullNameZh)}
              </p>
              <div className="flex flex-col items-end gap-0.5">
                <p className="text-[10px] text-orange-400 transition-opacity duration-150 leading-tight">
                  {getLocalizedValue(language, activeProfile.roleEn, activeProfile.roleAr, activeProfile.roleZh)}
                </p>
                <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <span>{t("My EHS Reports:", language)}</span>
                  <strong className="font-mono text-white text-[10px]">{getCurrentMonthIncidentsCount()}</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationsPanel 
                permits={permits}
                currentUser={currentUser}
                currentRole={currentRole}
                language={language}
                onSelectPermit={(id) => {
                  setIsCreating(false);
                  setSelectedPermitId(id);
                }}
              />
              <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-slate-500 flex items-center justify-center text-xs font-bold text-white select-none shadow-sm shrink-0">
                {initialsEn}
              </div>
              <button
                onClick={() => setLanguage(lang => {
                  if (lang === 'ar') return 'en';
                  if (lang === 'en') return 'zh';
                  return 'ar';
                })}
                className="px-2.5 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors border border-slate-700 shrink-0 font-sans"
                title={
                  language === 'ar' 
                    ? 'Switch to English / 切换到英文' 
                    : language === 'en' 
                      ? '切换为中文 / تغيير للعربية' 
                      : 'تغيير للعربية / Switch to English'
                }
              >
                <Globe className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-[10px] font-bold text-slate-200">
                  {language === 'ar' ? 'العربية' : language === 'en' ? 'EN' : '中文'}
                </span>
              </button>
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors border border-red-500/20"
                title={t('Log out', language)}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* SECTION 2: MODULAR EHS SEGMENT SELECTOR */}
      <div className="bg-white dark:bg-neutral-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-row gap-1 sm:gap-2 py-3 overflow-x-auto justify-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          
          <button
            id="tab-permits"
            onClick={() => { setActiveTab('PERMITS'); setSelectedPermitId(null); setIsCreating(false); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
              activeTab === 'PERMITS' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
            }`}
          >
            <FileStack className="w-4 h-4" />
            <span>{t("Permits to Work", language)}</span>
          </button>

          <button
            id="tab-incidents"
            onClick={() => { setActiveTab('INCIDENTS'); setSelectedPermitId(null); setIsCreating(false); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
              activeTab === 'INCIDENTS' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{t("Incident Management", language)}</span>
          </button>

          <button
            id="tab-hira"
            onClick={() => { setActiveTab('HIRA'); setSelectedPermitId(null); setIsCreating(false); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
              activeTab === 'HIRA' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>{t("HIRA Risk Matrix", language)}</span>
          </button>

          <button
            id="tab-audits"
            onClick={() => { setActiveTab('AUDITS'); setSelectedPermitId(null); setIsCreating(false); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
              activeTab === 'AUDITS' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>{t("Compliance Audits", language)}</span>
          </button>

          <button
            id="tab-training"
            onClick={() => { setActiveTab('TRAINING'); setSelectedPermitId(null); setIsCreating(false); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
              activeTab === 'TRAINING' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>{t("Safety Trainings", language)}</span>
          </button>

          <button
            id="tab-ai-copilot"
            onClick={() => { setActiveTab('AI_COPILOT'); setSelectedPermitId(null); setIsCreating(false); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer border border-indigo-200 dark:border-indigo-950/20 ${
              activeTab === 'AI_COPILOT' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-650/40' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
            }`}
          >
            <Brain className="w-4 h-4 text-orange-500 animate-pulse" />
            <span>{t("Safety AI Copilot", language)}</span>
          </button>

          <button
            id="tab-performance"
            onClick={() => { setActiveTab('PERFORMANCE'); setSelectedPermitId(null); setIsCreating(false); }}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
              activeTab === 'PERFORMANCE' 
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>{t("Platform Performance", language)}</span>
          </button>

          {currentUser?.username === 'admin' && (
            <button
              id="tab-users"
              onClick={() => { setActiveTab('USERS'); setSelectedPermitId(null); setIsCreating(false); }}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg flex items-center gap-1.5 shrink-0 select-none transition-all cursor-pointer ${
                activeTab === 'USERS' 
                  ? 'bg-slate-850 text-white shadow-md shadow-slate-900/20 dark:bg-white dark:text-slate-900' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-150 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4 text-orange-400" />
              <span>{t("Personnel Registry", language)}</span>
            </button>
          )}
          
        </div>
      </div>

      {/* SECTION 3: MAIN LAYOUT */}
      <main className="grow max-w-7xl w-full mx-auto p-4 flex flex-col gap-6">
        
        {activeTab === 'PERMITS' && (
          isCreating ? (
            /* Create Permit view panel */
            <motion.div
              id="fade-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PermitForm
                onSaveDraft={handleCreateDraft}
                onCancel={() => setIsCreating(false)}
                currentUser={currentUser}
                language={language}
              />
            </motion.div>
          ) : activePermit ? (
            /* Permit Detail View (Workflow State Machine) */
            <motion.div
              id="fade-detail"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PermitDetail
                permit={activePermit}
                currentRole={currentRole}
                currentUser={currentUser}
                language={language}
                onUpdatePermit={handleUpdatePermit}
                onDeletePermit={handleDeletePermit}
                onBackToDashboard={() => setSelectedPermitId(null)}
              />
            </motion.div>
          ) : (
            /* Main Analytical Dashboard & Permits list grid */
            <motion.div
              id="fade-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard
                permits={permits}
                selectedId={selectedPermitId}
                onSelectPermit={setSelectedPermitId}
                onCreateNewClick={() => {
                  if (currentUser?.canCreatePermit) {
                    setIsCreating(true);
                  }
                }}
                currentRole={currentRole}
                currentUser={currentUser}
                language={language}
              />
            </motion.div>
          )
        )}

        {activeTab === 'INCIDENTS' && (
          <motion.div
            id="fade-incidents"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <IncidentManager
              incidents={incidents}
              onAddIncident={handleAddIncident}
              onUpdateIncident={handleUpdateIncident}
              onDeleteIncident={handleDeleteIncident}
              currentRole={currentRole}
              language={language}
              currentUser={currentUser}
              users={users.length > 0 ? users : DEFAULT_USERS_SEED}
            />
          </motion.div>
        )}

        {activeTab === 'HIRA' && (
          <motion.div
            id="fade-hira"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HiraManager
              hiras={hiras}
              onAddHira={handleAddHira}
              onUpdateHira={handleUpdateHira}
              onDeleteHira={handleDeleteHira}
              currentRole={currentRole}
              language={language}
            />
          </motion.div>
        )}

        {activeTab === 'AUDITS' && (
          <motion.div
            id="fade-audits"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AuditManager
              audits={audits}
              onAddAudit={handleAddAudit}
              onUpdateAudit={handleUpdateAudit}
              language={language}
            />
          </motion.div>
        )}

        {activeTab === 'TRAINING' && (
          <motion.div
            id="fade-training"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TrainingManager
              trainings={trainings}
              onAddTraining={handleAddTraining}
              language={language}
            />
          </motion.div>
        )}

        {activeTab === 'AI_COPILOT' && (
          <motion.div
            id="fade-ai-copilot"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SafetyAiCopilot
              language={language}
            />
          </motion.div>
        )}

        {activeTab === 'PERFORMANCE' && (
          <motion.div
            id="fade-performance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <PlatformPerformance
              permits={permits}
              incidents={incidents}
              audits={audits}
              trainings={trainings}
              language={language}
            />
          </motion.div>
        )}

        {activeTab === 'USERS' && currentUser?.username === 'admin' && (
          <motion.div
            id="fade-users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <UserManager
              users={users}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onUpdateUser={handleUpdateUser}
              language={language}
            />
          </motion.div>
        )}

      </main>

      {/* SECTION 4: COHESIVE SYSTEM FOOTER */}
      <footer id="app-footer" className="bg-white dark:bg-neutral-900 border-t border-neutral-150 dark:border-neutral-800 py-6 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans justify-row-reverse text-right">
          
          <p id="footer-text-c" className="leading-relaxed">
            {language === 'ar'
              ? 'تطبيق تصاريح العمل الإلكتروني (PTW) • ملتزمون بمعايير إدارة السلامة والصحة المهنية بمصانع الإسمنت.'
              : (language === 'zh' ? '安全作业许可证 (PTW) 系统 • 致力于水泥厂职业健康安全危险源控制准则。' : 'Electronic Permit to Work (PTW) Portal • Committed to HSE cement plant hazards control directives.')}
          </p>

          <div className="flex gap-4 text-[11px] font-semibold text-neutral-450">
            <span className="flex items-center gap-1 justify-end">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('LOTO Secure', language)}</span>
            </span>
            <span className="flex items-center gap-1 justify-end">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
              <span>{t('Audited Portal', language)}</span>
            </span>
          </div>

        </div>
      </footer>

      {isLoggedIn && (
        <DeviceNotificationOverlay
          users={users}
          currentUser={currentUser}
          language={language}
          onAutoSwitchUser={handleAutoSwitchUser}
        />
      )}

    </div>
  );
}
