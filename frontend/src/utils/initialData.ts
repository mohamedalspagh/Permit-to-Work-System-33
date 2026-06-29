/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Permit, PermitType, PermitStatus, SandboxRole, UserProfile } from '../types';

export const USER_PROFILES: Record<SandboxRole, UserProfile> = {
  REQUESTER: {
    empCode: 'EMP101',
    password: '123',
    sandboxRole: 'REQUESTER',
    username: 'ahmad_eng',
    fullNameAr: 'م. أحمد المنفذ',
    fullNameEn: 'Eng. Ahmed Al-Monafed',
    fullNameZh: '艾哈迈德 工程师',
    roleAr: 'مشرف الفريق المنفذ',
    roleEn: 'Maintenance Engineer',
    roleZh: '维保工程师 / 申请人',
    departmentAr: 'إدارة الصيانة',
    departmentEn: 'Maintenance Administration',
    departmentZh: '维保管理部'
  },
  PRODUCTION: {
    empCode: 'EMP102',
    password: '123',
    sandboxRole: 'PRODUCTION',
    username: 'turki_prod',
    fullNameAr: 'م. تركي اليوسف',
    fullNameEn: 'Eng. Turki Al-Yousef',
    fullNameZh: '图尔基 经理',
    roleAr: 'مدير التشغيل والتحكم (الإنتاج)',
    roleEn: 'Production Manager',
    roleZh: '生产经理 / 审批人',
    departmentAr: 'إدارة الإنتاج والتشغيل',
    departmentEn: 'Production & Operations Administration',
    departmentZh: '生产运营部'
  },
  ELECTRICAL: {
    empCode: 'EMP103',
    password: '123',
    sandboxRole: 'ELECTRICAL',
    username: 'ali_elec',
    fullNameAr: 'م. علي عبد الله',
    fullNameEn: 'Eng. Ali Abdullah',
    fullNameZh: '阿里 经理',
    roleAr: 'رئيس إدارة الكهرباء والـ LOTO',
    roleEn: 'Electrical Manager',
    roleZh: '电气主管 / LOTO审批人',
    departmentAr: 'إدارة الكهرباء',
    departmentEn: 'Electrical Administration',
    departmentZh: '电气管理部'
  },
  HSE: {
    empCode: 'EMP104',
    password: '123',
    sandboxRole: 'HSE',
    username: 'asaad_hse',
    fullNameAr: 'م. أسعد الشمراني',
    fullNameEn: 'Eng. Asaad Al-Shamrani',
    fullNameZh: '阿萨德 工程师',
    roleAr: 'مشرف سيفيتي (HSE Inspector)',
    roleEn: 'HSE Inspector',
    roleZh: '安全监督员 (HSE)',
    departmentAr: 'إدارة السلامة والصحة المهنية',
    departmentEn: 'Safety & Occupational Health Administration (HSE)',
    departmentZh: '安全健康与环保部 (HSE)'
  }
};

export const PERMIT_TYPES_INFO = {
  HOT: {
    labelAr: 'تصريح عمل ساخن',
    labelEn: 'Hot Work Permit',
    labelZh: '动火作业许可证',
    color: 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400',
    iconName: 'Flame'
  },
  CONFINED: {
    labelAr: 'دخول أماكن مغلقة',
    labelEn: 'Confined Space Entry',
    labelZh: '受限空间进入许可证',
    color: 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400',
    iconName: 'Box'
  },
  HEIGHT: {
    labelAr: 'عمل على ارتفاعات',
    labelEn: 'Working at Height',
    labelZh: '高处作业许可证',
    color: 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400',
    iconName: 'ArrowUpCircle'
  },
  LOTO: {
    labelAr: 'عزل طاقة وقفل (LOTO)',
    labelEn: 'Lockout/Tagout (LOTO)',
    labelZh: '能量隔离/上锁挂牌 (LOTO)',
    color: 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400',
    iconName: 'Lock'
  },
  COLD: {
    labelAr: 'تصريح عمل بارد',
    labelEn: 'Cold Work Permit',
    labelZh: '通用冷工作业许可证',
    color: 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400',
    iconName: 'Droplets'
  }
};

export const STATUS_INFO = {
  DRAFT: {
    labelAr: 'مسودة',
    labelEn: 'Draft',
    labelZh: '草稿',
    color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
  },
  PENDING_DEPT: {
    labelAr: 'قيد الاعتمادات المبدئية',
    labelEn: 'Pending Approvals',
    labelZh: '等待各部门审批',
    color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900'
  },
  HSE_REVIEW: {
    labelAr: 'مراجعة قسم السلامة',
    labelEn: 'HSE Review',
    labelZh: '安全环保部(HSE)审核',
    color: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900'
  },
  ACTIVE: {
    labelAr: 'نشط وساري',
    labelEn: 'Active',
    labelZh: '激活并生效中',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
  },
  PENDING_CLOSE: {
    labelAr: 'طلب الإغلاق الميداني',
    labelEn: 'Pending Closure',
    labelZh: '申请现场关闭',
    color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900'
  },
  CLOSED: {
    labelAr: 'مغلق بأمان',
    labelEn: 'Closed',
    labelZh: '安全关闭并归档',
    color: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-900'
  },
  REJECTED: {
    labelAr: 'مرفوض',
    labelEn: 'Rejected',
    labelZh: '已驳回',
    color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900'
  }
};

export const STANDARD_PPES = [
  { id: 'helmet', labelAr: 'خوذة سلامة', labelEn: 'Safety Helmet' },
  { id: 'shoes', labelAr: 'حذاء سلامة مقاوم للمخاطر', labelEn: 'Steel Toe Safety Shoes' },
  { id: 'glasses', labelAr: 'نظارة حماية عازلة', labelEn: 'Safety Glasses' },
  { id: 'gloves_mech', labelAr: 'قفازات جلدية ميكانيكية', labelEn: 'Mechanical Leather Gloves' },
  { id: 'gloves_heat', labelAr: 'قفازات لحام عازلة للحرارة', labelEn: 'Welding Heat-Resistant Gloves' },
  { id: 'harness', labelAr: 'حزام أمان لكامل الجسم (ارتفاعات)', labelEn: 'Full-Body Safety Harness' },
  { id: 'mask_gas', labelAr: 'قناع تنفس مزود بفلتر غازات سامة', labelEn: 'Respirator mask with toxic gas filter' },
  { id: 'detector_gas', labelAr: 'جهاز رصد الغازات المحمول لدعم المراقبة', labelEn: 'Portable multi-gas detector' },
  { id: 'ear', labelAr: 'سدادات أذن مضادة للضوضاء العالية', labelEn: 'Ear Plugs / Muffs' },
  { id: 'vest', labelAr: 'سترة عاكسة للضوء عالية الوضوح', labelEn: 'High-Visibility Vest' }
];

export const STANDARD_HAZARDS = [
  { id: 'fire', labelAr: 'حريق - انفجار جراء الغازات أو الأخشاب', labelEn: 'Fire / Explosion Hazard' },
  { id: 'toxic_gas', labelAr: 'اختناق أو انبعاث غازات سامة (CO, H2S)', labelEn: 'Suffocation / Toxic Gases (CO, H2S)' },
  { id: 'falling', labelAr: 'سقوط من مرتفع أو انزلاق', labelEn: 'Fall from Height / Slip and Trip' },
  { id: 'electrocution', labelAr: 'صعق كهربائي جراء تشغيل خط إنتاج نشط', labelEn: 'Electrocution / Physical Contact with Live Wires' },
  { id: 'heat_burn', labelAr: 'حروق من أسطح حارة (جدار الفرن اللافح)', labelEn: 'Severe Heat Burns (Kiln Clinker Walls)' },
  { id: 'entrapment', labelAr: 'انحشار داخل تروس وناقل الحركة المعدني', labelEn: 'Entrapment / Pinched by Rotating Gears' },
  { id: 'dust', labelAr: 'تطاير غبار الإسمنت الكثيف (أضرار بالعين/التنفس)', labelEn: 'Heavy Particulate Cement Dust Exposure' }
];

export const PRECAUTIONS = [
  { id: 'loto_chk', labelAr: 'تطبيق إجراءات عزل الطاقة وتثبيت الأقفال LOTO', labelEn: 'Ensure physical LOTO application on the circuit breaker' },
  { id: 'gas_chk', labelAr: 'فحص الهواء والغازات في الصوامع قبل دخول العمال', labelEn: 'Perform gas test before allowing entry' },
  { id: 'fire_ext', labelAr: 'توفير طفايات حريق صالحة ومنتشرة بموقع اللحام', labelEn: 'Place functioning fire extinguishers next to hot zone' },
  { id: 'scaffold_chk', labelAr: 'فحص تماسك وصلاحية السقالة وتعليق كارت الأمان المعتمد', labelEn: 'Inspect scaffold and tag green tag safety cert' },
  { id: 'supervisor_chk', labelAr: 'تواجد مراقب دائم على باب الغرفة المغلقة طوال فترة العمل', labelEn: 'Station a continuous standby watcher at the entrance' },
  { id: 'ppe_chk', labelAr: 'التثبت النهائي من ارتداء الجميع لمعدات الوقاية الشخصية', labelEn: 'Verify all staff are strictly wearing required PPE' },
  { id: 'isolation_chk', labelAr: 'إغلاق المحابس وتفريغ السوائل والمواد الناعمة بالسيور', labelEn: 'Close feed valves and flush continuous belts' }
];

export const INITIAL_PERMITS: Permit[] = [];
