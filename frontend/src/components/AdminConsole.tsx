import React from 'react';
import { Building2, PlusCircle, ShieldCheck, Users2, KeyRound, Trash2, Crown } from 'lucide-react';
import type { Language, Tenant, UserProfile } from '../types';

interface AdminConsoleProps {
  companies: Tenant[];
  users: UserProfile[];
  onCreateCompany: (company: Tenant) => void;
  onCreateUser: (user: UserProfile) => void;
  onDeleteUser: (empCode: string) => void;
  onUpgradePlan: (companyId: string, plan: Tenant['plan']) => void;
  language: Language;
}

const emptyCompanyForm = {
  name: '',
  plan: 'STARTER' as Tenant['plan'],
  maxUsers: 20,
  status: 'TRIAL' as Tenant['status'],
  description: '',
  logoUrl: ''
};

const emptyUserForm = {
  fullNameEn: '',
  fullNameAr: '',
  username: '',
  password: '',
  empCode: '',
  tenantId: '',
  isCompanyAdmin: false
};

export function AdminConsole({ companies, users, onCreateCompany, onCreateUser, onDeleteUser, onUpgradePlan, language }: AdminConsoleProps) {
  const [companyForm, setCompanyForm] = React.useState(emptyCompanyForm);
  const [userForm, setUserForm] = React.useState(emptyUserForm);
  const [feedback, setFeedback] = React.useState('');

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setCompanyForm((prev) => ({ ...prev, logoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCompany = (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyForm.name.trim()) {
      setFeedback(language === 'ar' ? 'يرجى إدخال اسم الشركة.' : 'Please enter a company name.');
      return;
    }

    const newCompany: Tenant = {
      id: `tenant-${companyForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: companyForm.name.trim(),
      plan: companyForm.plan,
      maxUsers: companyForm.maxUsers,
      status: companyForm.status,
      description: companyForm.description.trim(),
      ownerEmail: `${companyForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@company.local`,
      logoUrl: companyForm.logoUrl.trim()
    };

    onCreateCompany(newCompany);
    setCompanyForm(emptyCompanyForm);
    setUserForm((prev) => ({ ...prev, tenantId: newCompany.id }));
    setFeedback(language === 'ar' ? 'تم إنشاء الشركة بنجاح.' : 'Company created successfully.');
  };

  const handleCreateUser = (event: React.FormEvent) => {
    event.preventDefault();
    if (!userForm.fullNameEn.trim() || !userForm.username.trim() || !userForm.password.trim() || !userForm.empCode.trim() || !userForm.tenantId) {
      setFeedback(language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة وتحديد الشركة.' : 'Please fill the required fields and choose a company.');
      return;
    }

    const selectedCompany = companies.find((company) => company.id === userForm.tenantId);
    const currentCompanyUsers = users.filter((entry) => entry.tenantId === userForm.tenantId);
    if (selectedCompany && currentCompanyUsers.length >= selectedCompany.maxUsers) {
      setFeedback(language === 'ar' ? 'تم الوصول إلى الحد الأقصى لعدد المستخدمين لهذه الشركة.' : 'This company has reached its maximum user limit.');
      return;
    }

    const role = userForm.username.toLowerCase().includes('hse') ? 'SAFETY_SUPERVISOR' : 'EMPLOYEE';
    const newUser: UserProfile = {
      empCode: userForm.empCode.trim().toUpperCase(),
      username: userForm.username.trim().toLowerCase(),
      password: userForm.password,
      sandboxRole: 'REQUESTER',
      customRole: userForm.isCompanyAdmin ? 'SUPER_ADMIN' : role,
      fullNameAr: userForm.fullNameAr.trim() || userForm.fullNameEn.trim(),
      fullNameEn: userForm.fullNameEn.trim(),
      roleAr: role === 'SAFETY_SUPERVISOR' ? 'مشرف سيفيتي' : 'موظف',
      roleEn: role === 'SAFETY_SUPERVISOR' ? 'HSE Supervisor' : 'Employee',
      departmentAr: 'إدارة التشغيل',
      departmentEn: 'Operations Administration',
      tenantId: userForm.tenantId,
      permissions: userForm.isCompanyAdmin
        ? ['permits.create', 'permits.view', 'permits.approve', 'users.manage', 'tenants.view']
        : role === 'SAFETY_SUPERVISOR'
          ? ['permits.create', 'permits.view', 'permits.approve', 'users.manage']
          : ['permits.create', 'permits.view']
    };

    onCreateUser(newUser);
    setUserForm(emptyUserForm);
    setFeedback(language === 'ar' ? 'تم إضافة المستخدم إلى الشركة بنجاح.' : 'User onboarded to the company successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-800" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">Production SaaS Admin</p>
              <h1 className="text-2xl font-bold">{language === 'ar' ? 'لوحة إدارة المنصات المتعددة الشركات' : 'Enterprise Multi-Company Administration Console'}</h1>
              <p className="mt-2 text-sm text-slate-600">
                {language === 'ar'
                  ? 'أنشئ شركات جديدة، واحجز المستخدمين لكل شركة بشكل منفصل، واحتفظ بالتحكم الكامل في خطة الاشتراك والأدوار.'
                  : 'Create companies, onboard users per company, and manage subscriptions and roles from a single professional admin workspace.'}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                {language === 'ar' ? 'الوصول الإداري محمي بالكامل' : 'Admin access is fully protected'}
              </div>
            </div>
          </div>
        </div>

        {feedback ? (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {feedback}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'إنشاء شركة جديدة' : 'Create a new company'}</h2>
            </div>
            <form className="space-y-4" onSubmit={handleCreateCompany}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">{language === 'ar' ? 'اسم الشركة' : 'Company name'}</span>
                  <input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">{language === 'ar' ? 'الخطة' : 'Plan'}</span>
                  <select value={companyForm.plan} onChange={(e) => setCompanyForm({ ...companyForm, plan: e.target.value as Tenant['plan'] })} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">{language === 'ar' ? 'أقصى عدد مستخدمين' : 'Maximum users'}</span>
                  <input type="number" min="1" value={companyForm.maxUsers} onChange={(e) => setCompanyForm({ ...companyForm, maxUsers: Number(e.target.value) })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">{language === 'ar' ? 'الحالة' : 'Status'}</span>
                  <select value={companyForm.status} onChange={(e) => setCompanyForm({ ...companyForm, status: e.target.value as Tenant['status'] })} className="w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="TRIAL">Trial</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </label>
              </div>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">{language === 'ar' ? 'وصف الشركة' : 'Company description'}</span>
                <textarea value={companyForm.description} onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" rows={3} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">{language === 'ar' ? 'شعار الشركة' : 'Company logo'}</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                <input value={companyForm.logoUrl} onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" placeholder={language === 'ar' ? 'أو أدخل رابط صورة' : 'Or enter an image URL'} />
              </label>
              {companyForm.logoUrl ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-700">{language === 'ar' ? 'معاينة الشعار' : 'Logo preview'}</p>
                  <img src={companyForm.logoUrl} alt="Logo preview" className="h-20 w-20 rounded-xl object-cover border border-slate-200" />
                </div>
              ) : null}
              <button type="submit" className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white">
                <PlusCircle className="h-4 w-4" />
                {language === 'ar' ? 'إنشاء الشركة' : 'Create company'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Users2 className="h-5 w-5 text-orange-600" />
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'حجز مستخدمين لشركة' : 'Onboard users for a company'}</h2>
            </div>
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">{language === 'ar' ? 'اختيار الشركة' : 'Select company'}</span>
                <select value={userForm.tenantId} onChange={(e) => setUserForm({ ...userForm, tenantId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" required>
                  <option value="">{language === 'ar' ? 'اختر شركة' : 'Choose a company'}</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">{language === 'ar' ? 'الاسم الكامل (EN)' : 'Full name (EN)'}</span>
                  <input value={userForm.fullNameEn} onChange={(e) => setUserForm({ ...userForm, fullNameEn: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">{language === 'ar' ? 'الاسم الكامل (AR)' : 'Full name (AR)'}</span>
                  <input value={userForm.fullNameAr} onChange={(e) => setUserForm({ ...userForm, fullNameAr: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">{language === 'ar' ? 'اسم المستخدم' : 'Username'}</span>
                  <input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block">{language === 'ar' ? 'كلمة المرور' : 'Password'}</span>
                  <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
                </label>
              </div>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">{language === 'ar' ? 'رمز الموظف' : 'Employee code'}</span>
                <input value={userForm.empCode} onChange={(e) => setUserForm({ ...userForm, empCode: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" required />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={Boolean(userForm.isCompanyAdmin)} onChange={(e) => setUserForm({ ...userForm, isCompanyAdmin: e.target.checked })} />
                <span>{language === 'ar' ? 'منح دور مدير الشركة' : 'Assign company-admin role'}</span>
              </label>
              <button type="submit" className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
                <KeyRound className="h-4 w-4" />
                {language === 'ar' ? 'حجز المستخدم' : 'Create user assignment'}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{language === 'ar' ? 'الشركات والمستخدمون' : 'Companies and users'}</h2>
            <span className="text-sm text-slate-500">{companies.length} companies • {users.length} users</span>
          </div>
          <div className="space-y-4">
            {companies.map((company) => {
              const companyUsers = users.filter((user) => user.tenantId === company.id);
              return (
                <div key={company.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{company.name}</h3>
                      <p className="text-sm text-slate-600">{company.description || (language === 'ar' ? 'شركة مدارة من لوحة الإدارة' : 'Managed from the admin console')}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
                      <Crown className="h-4 w-4" />
                      <select value={company.plan} onChange={(event) => onUpgradePlan(company.id, event.target.value as Tenant['plan'])} className="rounded border border-orange-200 bg-white px-2 py-1 text-sm">
                        <option value="STARTER">Starter</option>
                        <option value="GROWTH">Growth</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                      <span>• {company.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {companyUsers.length > 0 ? companyUsers.map((user) => (
                      <div key={user.empCode} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                        <div>
                          <div className="font-semibold">{user.fullNameEn}</div>
                          <div className="text-xs text-slate-500">@{user.username} • {user.customRole || 'EMPLOYEE'}</div>
                        </div>
                        <button onClick={() => onDeleteUser(user.empCode)} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )) : (
                      <div className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                        {language === 'ar' ? 'لا يوجد مستخدمون مسجلون لهذه الشركة بعد.' : 'No users have been onboarded to this company yet.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
