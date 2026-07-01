/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Permit, SandboxRole, Incident, HiraAssessment, SafetyAudit, TrainingRecord, UserProfile, Language, Tenant } from './types';
import { USER_PROFILES } from './utils/initialData';
import { t, getLocalizedValue } from './utils/translations';
import { DEFAULT_TENANTS, canManageUsers, canApprovePermits, filterTenantRecords, getTenantDisplayName, getTenantFeatureHints, getTenantPlanLabel, isTenantActive } from './utils/saas';
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
import { AdminConsole } from './components/AdminConsole';
import { CompanyDashboard } from './components/CompanyDashboard';
import { CompanyBillingAnalytics } from './components/CompanyBillingAnalytics';
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
    departmentEn: 'Maintenance Administration',
    tenantId: 'tenant-demo',
    permissions: ['permits.create', 'permits.view']
  });
  const [activeTenant, setActiveTenant] = React.useState<Tenant>(DEFAULT_TENANTS[0]);
  const [currentRole, setCurrentRole] = React.useState<SandboxRole>('REQUESTER');
  const [language, setLanguage] = React.useState<Language>('ar');
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [currentTime, setCurrentTime] = React.useState<string>('');
  const [tenants, setTenants] = React.useState<Tenant[]>(DEFAULT_TENANTS);
  const [isAdminMode, setIsAdminMode] = React.useState<boolean>(false);
  const [isCompanyDashboardMode, setIsCompanyDashboardMode] = React.useState<boolean>(false);
  const [isBillingAnalyticsMode, setIsBillingAnalyticsMode] = React.useState<boolean>(false);

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

  const handleCreateCompany = (company: Tenant) => {
    setTenants((prev) => [company, ...prev]);
    setActiveTenant(company);
  };

  const handleUpgradeCompanyPlan = (companyId: string, plan: Tenant['plan']) => {
    setTenants((prev) => prev.map((tenant) => tenant.id === companyId ? { ...tenant, plan } : tenant));
  };

  const handleCreateUser = (user: UserProfile) => {
    const selectedTenant = tenants.find((tenant) => tenant.id === user.tenantId);
    const currentTenantUsers = users.filter((entry) => entry.tenantId === user.tenantId);
    if (selectedTenant && currentTenantUsers.length >= selectedTenant.maxUsers) {
      return;
    }

    setUsers((prev) => [user, ...prev]);
    if (user.tenantId) {
      setCurrentUser((prev) => ({ ...prev, tenantId: user.tenantId, permissions: user.permissions ?? prev.permissions }));
    }
  };

  const handleSwitchTenant = (tenantId: string) => {
    const nextTenant = tenants.find((tenant) => tenant.id === tenantId) || activeTenant;
    if (nextTenant) {
      setActiveTenant(nextTenant);
      setCurrentUser((prev) => ({ ...prev, tenantId: nextTenant.id }));
      setIsCompanyDashboardMode(false);
      setIsBillingAnalyticsMode(false);
      setActiveTab('PERMITS');
    }
  };

  const handleAdminDeleteUser = (empCode: string) => {
    setUsers((prev) => prev.filter((entry) => entry.empCode !== empCode));
  };

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
          } else {
            loadUsersInMemory();
          }

          if (dbPermits) {
            let permitList = dbPermits;
            if (permitList.length === 0) {
              permitList = INITIAL_PERMITS_SEED;
              await dbSavePermitsBatch(INITIAL_PERMITS_SEED);
            }
            setPermits(permitList);
          } else {
            loadPermitsInMemory();
          }

          if (dbIncidents) {
            let incidentList = dbIncidents;
            if (incidentList.length === 0) {
              incidentList = INITIAL_INCIDENTS;
              await dbSaveIncidentsBatch(INITIAL_INCIDENTS);
            }
            setIncidents(incidentList);
          } else {
            loadIncidentsInMemory();
          }

          if (dbHiras) {
            let hiraList = dbHiras;
            if (hiraList.length === 0) {
              hiraList = INITIAL_HIRAS;
              await dbSaveHirasBatch(INITIAL_HIRAS);
            }
            setHiras(hiraList);
          } else {
            loadHirasInMemory();
          }

          if (dbAudits) {
            let auditList = dbAudits;
            if (auditList.length === 0) {
              auditList = INITIAL_AUDITS;
              await dbSaveAuditsBatch(INITIAL_AUDITS);
            }
            setAudits(auditList);
          } else {
            loadAuditsInMemory();
          }

          if (dbTrainings) {
            let trainingList = dbTrainings;
            if (trainingList.length === 0) {
              trainingList = INITIAL_TRAINING;
              await dbSaveTrainingsBatch(INITIAL_TRAINING);
            }
            setTrainings(trainingList);
          } else {
            loadTrainingsInMemory();
          }
        } catch (error) {
          console.error("Failed to load Firebase data, falling back to in-memory seeds", error);
          loadAllInMemory();
        }
      } else {
        loadAllInMemory();
      }
    }

    function loadUsersInMemory() {
      let userList = [...DEFAULT_USERS_SEED];
      const hasAdmin = userList.some((u: any) => u.username === 'admin');
      if (!hasAdmin) {
        userList.unshift({
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
      }
      setUsers(userList);
    }

    function loadPermitsInMemory() {
      setPermits(INITIAL_PERMITS_SEED);
    }

    function loadIncidentsInMemory() {
      setIncidents(INITIAL_INCIDENTS);
    }

    function loadHirasInMemory() {
      setHiras(INITIAL_HIRAS);
    }

    function loadAuditsInMemory() {
      setAudits(INITIAL_AUDITS);
    }

    function loadTrainingsInMemory() {
      setTrainings(INITIAL_TRAINING);
    }

    function loadAllInMemory() {
      loadUsersInMemory();
      loadPermitsInMemory();
      loadIncidentsInMemory();
      loadHirasInMemory();
      loadAuditsInMemory();
      loadTrainingsInMemory();
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
    if (activeTab === 'USERS' && (!currentUser || !canManageUsers(currentUser))) {
      setActiveTab('PERMITS');
    }
  }, [activeTab, currentUser]);

  // Sync state mutations to local storage
  // Dynamic User updaters
  const handleAddUser = async (newUser: UserProfile) => {
    const updated = [...users, newUser];
    setUsers(updated);
    const success = await dbSaveUser(newUser);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حفظ المستخدم في Firebase!' : '⚠️ Failed to save user to Firebase!');
    }
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    const updated = users.map(u => u.empCode === updatedUser.empCode ? updatedUser : u);
    setUsers(updated);
    const success = await dbSaveUser(updatedUser);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل تحديث المستخدم في Firebase!' : '⚠️ Failed to update user to Firebase!');
    }
    
    // If we updated the currently logged in user, refresh their record
    if (currentUser && currentUser.empCode === updatedUser.empCode) {
      setCurrentUser(updatedUser);
      localStorage.setItem('ehs_active_user_v3', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = async (empCode: string) => {
    const updated = users.filter(u => u.empCode !== empCode);
    setUsers(updated);
    const success = await dbDeleteUser(empCode);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حذف المستخدم من Firebase!' : '⚠️ Failed to delete user from Firebase!');
    }
  };

  const savePermitsState = (updatedList: Permit[]) => {
    setPermits(updatedList);
  };

  const saveIncidentsState = (updated: Incident[]) => {
    setIncidents(updated);
  };

  const saveHirasState = (updated: HiraAssessment[]) => {
    setHiras(updated);
  };

  const saveAuditsState = (updated: SafetyAudit[]) => {
    setAudits(updated);
  };

  const saveTrainingsState = (updated: TrainingRecord[]) => {
    setTrainings(updated);
  };

  // Updaters for newly integrated modules
  const handleAddIncident = async (newInc: Incident) => {
    const list = [newInc, ...incidents];
    saveIncidentsState(list);
    const success = await dbSaveIncident(newInc);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حفظ بلاغ الحادث في Firebase!' : '⚠️ Failed to save incident to Firebase!');
    }
  };

  const handleUpdateIncident = async (updated: Incident) => {
    const list = incidents.map(i => i.id === updated.id ? updated : i);
    saveIncidentsState(list);
    const success = await dbSaveIncident(updated);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل تحديث بلاغ الحادث في Firebase!' : '⚠️ Failed to update incident in Firebase!');
    }
  };

  const handleDeleteIncident = async (id: string) => {
    const list = incidents.filter(i => i.id !== id);
    saveIncidentsState(list);
    const success = await dbDeleteIncident(id);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حذف بلاغ الحادث من Firebase!' : '⚠️ Failed to delete incident from Firebase!');
    }
  };

  const handleAddHira = async (newHira: HiraAssessment) => {
    const list = [newHira, ...hiras];
    saveHirasState(list);
    const success = await dbSaveHira(newHira);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حفظ تقييم المخاطر (HIRA) في Firebase!' : '⚠️ Failed to save HIRA assessment to Firebase!');
    }
  };

  const handleUpdateHira = async (updated: HiraAssessment) => {
    const list = hiras.map(h => h.id === updated.id ? updated : h);
    saveHirasState(list);
    const success = await dbSaveHira(updated);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل تحديث تقييم المخاطر (HIRA) في Firebase!' : '⚠️ Failed to update HIRA assessment in Firebase!');
    }
  };

  const handleDeleteHira = async (id: string) => {
    const list = hiras.filter(h => h.id !== id);
    saveHirasState(list);
    const success = await dbDeleteHira(id);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حذف تقييم المخاطر (HIRA) من Firebase!' : '⚠️ Failed to delete HIRA assessment from Firebase!');
    }
  };

  const handleAddAudit = async (newAudit: SafetyAudit) => {
    const list = [newAudit, ...audits];
    saveAuditsState(list);
    const success = await dbSaveAudit(newAudit);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حفظ التدقيق في Firebase!' : '⚠️ Failed to save audit to Firebase!');
    }
  };

  const handleUpdateAudit = async (updated: SafetyAudit) => {
    const list = audits.map(a => a.id === updated.id ? updated : a);
    saveAuditsState(list);
    const success = await dbSaveAudit(updated);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل تحديث التدقيق في Firebase!' : '⚠️ Failed to update audit in Firebase!');
    }
  };

  const handleAddTraining = async (newTr: TrainingRecord) => {
    const list = [newTr, ...trainings];
    saveTrainingsState(list);
    const success = await dbSaveTraining(newTr);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حفظ التدريب في Firebase!' : '⚠️ Failed to save training record to Firebase!');
    }
  };

  // Updaters (Existing Permits)
  const handleUpdatePermit = async (updatedPermit: Permit) => {
    const newList = permits.map(p => p.id === updatedPermit.id ? updatedPermit : p);
    savePermitsState(newList);
    const success = await dbSavePermit(updatedPermit);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل تحديث التصريح في Firebase!' : '⚠️ Failed to update permit in Firebase!');
    }
  };

  const handleCreateDraft = async (newPermit: Permit) => {
    const newList = [newPermit, ...permits];
    savePermitsState(newList);
    const success = await dbSavePermit(newPermit);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حفظ مسودة التصريح في Firebase!' : '⚠️ Failed to save permit draft to Firebase!');
    }
    setIsCreating(false);
    setSelectedPermitId(newPermit.id); // Open it immediately in detailed review
  };

  const handleDeletePermit = async (id: string) => {
    const newList = permits.filter(p => p.id !== id);
    savePermitsState(newList);
    const success = await dbDeletePermit(id);
    if (!success) {
      alert(language === 'ar' ? '⚠️ فشل حذف التصريح من Firebase!' : '⚠️ Failed to delete permit from Firebase!');
    }
    setSelectedPermitId(null);
  };

  // Find currently selected permit
  const activePermit = permits.find(p => p.id === selectedPermitId);

  // Stats calculation
  const scopedPermits = filterTenantRecords(permits, activeTenant.id);
  const totalCount = scopedPermits.length;
  const activeCount = scopedPermits.filter(p => p.status === 'ACTIVE').length;
  const closedCount = scopedPermits.filter(p => p.status === 'CLOSED').length;
  const pendingCount = scopedPermits.filter(p => p.status === 'PENDING_DEPT' || p.status === 'HSE_REVIEW').length;

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
      <div className="min-h-screen bg-[#F1F5F9] p-4 flex items-center justify-center">
        <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">SaaS-ready EHS Platform</h2>
              <p className="text-sm text-slate-500">Tenant-aware login, RBAC controls, and multi-company isolation are now part of the experience.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              {DEFAULT_TENANTS.map((tenant) => (
                <div key={tenant.id} className="flex items-center gap-2">
                  <span className="font-semibold">{tenant.name}</span>
                  <span className="text-xs uppercase text-slate-400">{tenant.plan}</span>
                </div>
              ))}
            </div>
          </div>
          <LoginScreen 
            users={users.length > 0 ? users : DEFAULT_USERS_SEED}
            onLogin={(user) => {
              const tenant = tenants.find((item) => item.id === (user.tenantId || 'tenant-demo')) || tenants[0] || DEFAULT_TENANTS[0];
              setCurrentUser({ ...user, tenantId: tenant.id, permissions: user.permissions ?? ['permits.create', 'permits.view'] });
              setActiveTenant(tenant);
              setCurrentRole(user.sandboxRole || 'REQUESTER');
              setIsLoggedIn(true);
              setIsAdminMode(user.username === 'admin');
              setIsCompanyDashboardMode(user.customRole === 'SUPER_ADMIN' || user.permissions?.includes('tenants.view'));
              if (user.username !== 'admin') {
                setActiveTab('PERMITS');
              }
            }} 
            language={language} 
            onLanguageChange={setLanguage}
          />
        </div>
      </div>
    );
  }

  if (isAdminMode) {
    return (
      <AdminConsole
        companies={tenants}
        users={users}
        onCreateCompany={handleCreateCompany}
        onCreateUser={handleCreateUser}
        onDeleteUser={handleAdminDeleteUser}
        onUpgradePlan={handleUpgradeCompanyPlan}
        language={language}
      />
    );
  }

  if (isCompanyDashboardMode) {
    return (
      <CompanyDashboard
        company={activeTenant}
        currentUser={currentUser}
        users={users}
        language={language}
        onSwitchTenant={handleSwitchTenant}
        onOpenBilling={() => setIsBillingAnalyticsMode(true)}
      />
    );
  }

  if (isBillingAnalyticsMode) {
    return (
      <CompanyBillingAnalytics
        company={activeTenant}
        currentUser={currentUser}
        users={users}
        language={language}
        onUpgradePlan={(plan) => handleUpgradeCompanyPlan(activeTenant.id, plan)}
        onBack={() => {
          setIsBillingAnalyticsMode(false);
          setIsCompanyDashboardMode(true);
        }}
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
              <p className="mt-1 text-[10px] font-semibold text-orange-400">
                {getTenantDisplayName(activeTenant)} • {getTenantPlanLabel(activeTenant)} • {isTenantActive(activeTenant) ? 'Active tenant' : 'Restricted tenant'}
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
        <div className="max-w-7xl mx-auto px-4 py-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">Tenant scope:</span> {getTenantDisplayName(activeTenant)} • {getTenantPlanLabel(activeTenant)} • RBAC enabled • Audit trail ready
          <div className="mt-1 flex flex-wrap gap-2">
            {getTenantFeatureHints(activeTenant).map((hint) => (
              <span key={hint} className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">
                {hint}
              </span>
            ))}
          </div>
        </div>
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
          <div className="flex gap-4 text-[11px] font-semibold text-neutral-450 items-center">
            <span className="text-[10px] bg-slate-100 dark:bg-neutral-850 px-2 py-0.5 rounded text-neutral-500">
              Firebase: {isFirebaseConfigured ? `Connected (${import.meta.env.VITE_FIREBASE_PROJECT_ID})` : 'Disconnected'}
            </span>
            <span className="flex items-center gap-1 justify-end">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('LOTO Secure', language)}</span>
            </span>
            <span className="flex items-center gap-1 justify-end">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
              <span>{t('Audited Portal', language)}</span>
            </span>
          </div>        </div>
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
