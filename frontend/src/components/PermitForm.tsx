/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Permit, PermitType, PermitStatus, AuditLogEntry, UserProfile, Language } from '../types';
import { PERMIT_TYPES_INFO, STANDARD_HAZARDS, STANDARD_PPES } from '../utils/initialData';
import { 
  FileText, Plus, CheckCircle, ArrowRight, ShieldCheck, 
  AlertTriangle, Hammer, Users, CalendarClock, MapPin
} from 'lucide-react';

interface PermitFormProps {
  onSaveDraft: (newPermit: Permit) => void;
  onCancel: () => void;
  currentUser?: UserProfile;
  language: Language;
}

export const PermitForm: React.FC<PermitFormProps> = ({
  onSaveDraft,
  onCancel,
  currentUser,
  language
}) => {
  // Form values state
  const [title, setTitle] = React.useState('');
  const [type, setType] = React.useState<PermitType>('COLD');
  const [location, setLocation] = React.useState('');
  const [description, setDescription] = React.useState('');
  
  // Hazards & PPE Checklist states
  const [choosenHazards, setChoosenHazards] = React.useState<string[]>([]);
  const [choosenPpes, setChoosenPpes] = React.useState<string[]>(['helmet', 'shoes', 'glasses']);
  
  // Dept routing checkboxes
  const [prodRequired, setProdRequired] = React.useState(true);
  const [elecRequired, setElecRequired] = React.useState(false);
  
  // Dates
  const [startDate, setStartDate] = React.useState('2026-06-07T08:00');
  const [endDate, setEndDate] = React.useState('2026-06-07T16:00');

  // Workers
  const [workerInput, setWorkerInput] = React.useState('');
  const [workersList, setWorkersList] = React.useState<string[]>([]);

  // Toggle helpers
  const handleToggleHazard = (id: string) => {
    if (choosenHazards.includes(id)) {
      setChoosenHazards(choosenHazards.filter(h => h !== id));
    } else {
      setChoosenHazards([...choosenHazards, id]);
    }
  };

  const handleTogglePpe = (id: string) => {
    if (choosenPpes.includes(id)) {
      setChoosenPpes(choosenPpes.filter(p => p !== id));
    } else {
      setChoosenPpes([...choosenPpes, id]);
    }
  };

  const handleAddWorker = () => {
    if (workerInput.trim()) {
      setWorkersList([...workersList, workerInput.trim()]);
      setWorkerInput('');
    }
  };

  const handleRemoveWorker = (index: number) => {
    setWorkersList(workersList.filter((_, idx) => idx !== index));
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !location.trim() || !description.trim()) {
      alert(language === 'ar' ? 'الرجاء إكمال كافة الحقول الأساسية (العنوان، الموقع والتفاصيل).' : 'Please fill all core fields: Title, Location and Description.');
      return;
    }

    if (workersList.length === 0) {
      alert(language === 'ar' ? 'يجب إضافة عامل واحد على الأقل لطاقم الصيانة لفتح التصريح.' : 'At least one field worker must be designated to perform the work under this permit.');
      return;
    }

    // Auto routing adjustment based on type
    let finalElecRequired = elecRequired;
    let finalProdRequired = prodRequired;

    if (type === 'LOTO') {
      finalElecRequired = true;
    }

    const newPermitId = `PTW-2026-0${Math.floor(100 + Math.random() * 900)}`;

    const actorName = currentUser ? (language === 'ar' ? currentUser.fullNameAr : currentUser.fullNameEn) : 'م. أحمد المنفذ';
    const actorRoleAr = currentUser ? currentUser.roleAr : 'مشرف الفريق المنفذ';
    const actorRoleEn = currentUser ? currentUser.roleEn : 'Maintenance Site Supervisor';

    const firstAudit: AuditLogEntry = {
      id: `L-${Date.now()}`,
      timestamp: new Date().toISOString().substring(0, 16).replace('T', ' '),
      actionAr: `إنشاء مسودة تصريح العمل (${type})`,
      actionEn: `Created work permit draft (${type})`,
      actorName,
      actorRoleAr,
      actorRoleEn,
      comment: language === 'ar' 
        ? 'تم تدوين مخطط تفاصيل المهمة وتحديد لوائح الوقاية للتصديق.' 
        : 'Logged core work specifications and declared safety safeguards for EHS approval.'
    };

    const newPermit: Permit = {
      id: newPermitId,
      title,
      type,
      location,
      requesterName: actorName,
      requesterRoleAr: actorRoleAr,
      requesterRoleEn: actorRoleEn,
      description,
      hazards: choosenHazards,
      startDate,
      endDate,
      status: 'DRAFT',
      
      productionRequired: finalProdRequired,
      productionApproval: false,
      
      electricalRequired: finalElecRequired,
      electricalApproval: false,
      
      lotoRequired: type === 'LOTO' || finalElecRequired,
      gasTestRequired: type === 'CONFINED',

      hseApproval: false,
      requiredPPE: choosenPpes,
      safetyPrecautionConfirmations: {},
      workers: workersList,
      auditTrail: [firstAudit]
    };

    onSaveDraft(newPermit);
  };

  return (
    <form id="ptw-draft-form" onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-md flex flex-col gap-6 text-right font-sans">
      
      {/* Form Header */}
      <div id="form-header" className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-2.5 justify-start flex-row-reverse">
          <div className="bg-orange-500 p-2 rounded-lg text-white">
            <Plus id="plus-icon" className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <h2 id="new-form-title" className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100">
              {language === 'ar' ? 'إنشاء مسودة تصريح عمل جديدة' : 'Create New Permit is Draft'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              {language === 'ar' ? 'حدد خطورتها وجدولتها والإدارة المعنية المكلفة.' : 'Configure plant safety checkpoints, hazards, dates and worker teams.'}
            </p>
          </div>
        </div>

        <button
          id="cancel-draft-btn"
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 border border-neutral-250 hover:bg-neutral-50 text-neutral-600 dark:text-neutral-350 dark:border-neutral-750 text-xs font-bold rounded-lg cursor-pointer"
        >
          {language === 'ar' ? 'إلغاء التعديل ❌' : 'Cancel draft ❌'}
        </button>
      </div>

      {/* 2. Core Section Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-neutral-500 uppercase flex items-center justify-start gap-1 justify-row-reverse">
            <FileText className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'ar' ? 'عنوان تصريح العمل بالكامل:' : 'Full job Permit title:'}</span>
          </label>
          <input
            id="draft-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={language === 'ar' ? 'مثال: تغيير قشط طاحونة الوجبة الغذائية رقم ٣' : 'e.g. Raw Mill No.3 Conveyor Belt repair...'}
            className="text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Permit Class and Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-neutral-500 uppercase">{language === 'ar' ? 'فئة وتصنيف خطورة التصريح:' : 'PTW Danger Classification Type:'}</label>
          <select
            id="draft-type"
            value={type}
            onChange={(e) => setType(e.target.value as PermitType)}
            className="text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer"
          >
            {Object.keys(PERMIT_TYPES_INFO).map((typeKey) => (
              <option key={typeKey} value={typeKey}>
                {language === 'ar' ? PERMIT_TYPES_INFO[typeKey as PermitType].labelAr : PERMIT_TYPES_INFO[typeKey as PermitType].labelEn}
              </option>
            ))}
          </select>
        </div>

        {/* Location area */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-neutral-500 uppercase flex items-center justify-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span>{language === 'ar' ? 'ملمح موقع العمل بالمصنع (المنطقة):' : 'Factory zone / Location Area:'}</span>
          </label>
          <input
            id="draft-location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={language === 'ar' ? 'مثال: برج الطواحين - الدور الثالث (Kiln No 2 Area)' : 'e.g. Silo No.3 top dome floor...'}
            className="text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Department approvals routing preferences */}
        <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-3 rounded-lg flex flex-col justify-center gap-2">
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{language === 'ar' ? 'مسار التحكم بالاعتمادات المطلوبة:' : 'Target Departments Authorization:'}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 cursor-pointer leading-none">
              <input
                id="draft-prod-req"
                type="checkbox"
                checked={prodRequired}
                onChange={(e) => setProdRequired(e.target.checked)}
                className="accent-orange-500 cursor-pointer"
              />
              <span className="text-xs text-neutral-700 dark:text-neutral-300">{language === 'ar' ? 'موافقة إدارة الإنتاج والتشغيل' : 'Production Clearance'}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer leading-none">
              <input
                id="draft-elec-req"
                type="checkbox"
                disabled={type === 'LOTO'}
                checked={type === 'LOTO' || elecRequired}
                onChange={(e) => setElecRequired(e.target.checked)}
                className="accent-orange-500 cursor-pointer disabled:opacity-50"
              />
              <span className="text-xs text-neutral-700 dark:text-neutral-300">{language === 'ar' ? 'عزل الكهرباء وقشر LOTO' : 'LOTO Electrical Lock'}</span>
            </label>
          </div>
        </div>

        {/* Task description text */}
        <div className="md:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-bold text-neutral-500 uppercase">{language === 'ar' ? 'التوجيهات ووصف خطوات المهمة بالتفصيل:' : 'Description of work stages & methodology:'}</label>
          <textarea
            id="draft-desc"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={language === 'ar' ? 'اكتب بالتفصيل أدوات العمل، مثلاً: فتح بوابة الفلتر، تثبيت لوح الرفعة، فحص الكابل التالف من الصدأ...' : 'e.g. Scaffolding crew will construct platform up to duct roller, while welding crew prepares shielding masks and hoses...'}
            className="text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-orange-500 font-sans"
            rows={3}
          />
        </div>

      </div>

      {/* 3. Date Schedules & Site Workers lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Timing parameters */}
        <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 space-y-3">
          <h4 className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest flex items-center justify-start gap-1 flex-row-reverse">
            <CalendarClock className="w-4 h-4 text-orange-500" />
            <span>{language === 'ar' ? 'جدولة المناوبة والوردية:' : 'Scheduled Shift period:'}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
            <div>
              <label className="block text-[10px] text-neutral-450 mb-1">{language === 'ar' ? 'تاريخ وساعة بدء الصيانة:' : 'Validity Start:'}</label>
              <input
                id="draft-start-date"
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-450 mb-1">{language === 'ar' ? 'تاريخ وساعة انتهاء الصيانة:' : 'Validity Expiry:'}</label>
              <input
                id="draft-end-date"
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Crew workers input list */}
        <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-850 space-y-3">
          <h4 className="text-[11px] font-extrabold text-neutral-450 uppercase tracking-widest flex items-center justify-start gap-1 flex-row-reverse">
            <Users className="w-4 h-4 text-orange-500" />
            <span>{language === 'ar' ? 'طاقم العمل الميداني المكلّف بالمهمة:' : 'Field Maintenance Crew designation:'}</span>
          </h4>
          
          <div className="flex gap-2 justify-start items-center">
            <input
              id="worker-input-field"
              type="text"
              value={workerInput}
              onChange={(e) => setWorkerInput(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: سامي الحربي (فني ميكانيكا)' : 'e.g. John Doe (Welder)...'}
              className="text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg grow"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddWorker();
                }
              }}
            />
            <button
              id="add-worker-button"
              type="button"
              onClick={handleAddWorker}
              className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-white rounded-lg text-xs font-bold"
            >
              {language === 'ar' ? 'إضافة عامل' : 'Add worker'}
            </button>
          </div>

          <div id="workers-tags-container" className="flex flex-wrap gap-1.5 justify-start">
            {workersList.length === 0 ? (
              <p className="text-[10px] text-neutral-400 italic">
                {language === 'ar' ? '⚠️ يرجى إضافة عامل صيانة واحد على الأقل.' : '⚠️ No designated workers added. Input name and click Add.'}
              </p>
            ) : (
              workersList.map((workerName, ix) => (
                <span key={ix} className="bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-405 border border-amber-300 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1">
                  <span>{workerName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWorker(ix)}
                    className="text-amber-600 hover:text-rose-500 font-bold ml-1 cursor-pointer focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 4. Select Technical Hazards */}
      <div id="hazards-selection-box" className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-850">
        <h4 className="text-[11px] font-extrabold text-neutral-450 uppercase flex items-center gap-1.5 justify-start mb-3">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>{language === 'ar' ? 'تقييم المخاطر المحتملة بالمنطقة (اختر كل ما ينطبق):' : 'Potential Safety Hazards identified on work zone:'}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-right">
          {STANDARD_HAZARDS.map((hazard) => {
            const isChecked = choosenHazards.includes(hazard.id);
            return (
              <label key={hazard.id} className={`flex items-start gap-2.5 p-2 bg-white dark:bg-neutral-900 border rounded-lg cursor-pointer transition-all ${
                isChecked 
                  ? 'border-rose-300 bg-rose-500/5 dark:border-rose-900' 
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}>
                <input
                  id={`haz-cb-${hazard.id}`}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleHazard(hazard.id)}
                  className="mt-1 accent-rose-600 cursor-pointer"
                />
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-tight">
                  {language === 'ar' ? hazard.labelAr : hazard.labelEn}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Personal Protective Equipments (Mandated PPEs) */}
      <div id="ppes-selection-box" className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-200 dark:border-neutral-850">
        <h4 className="text-[11px] font-extrabold text-neutral-450 uppercase flex items-center gap-1.5 justify-start mb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{language === 'ar' ? 'لائحة معدات السلامة الشخصية المقررة كمطلب للعمل (PPE):' : 'Mandated Safety Apparel & Equipment Checklist (PPE):'}</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-right">
          {STANDARD_PPES.map((ppe) => {
            const isChecked = choosenPpes.includes(ppe.id);
            return (
              <label key={ppe.id} className={`flex items-center gap-2 p-2 bg-white dark:bg-neutral-900 border rounded-lg cursor-pointer transition-all ${
                isChecked 
                  ? 'border-emerald-300 bg-emerald-500/5 dark:border-emerald-900' 
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}>
                <input
                  id={`ppe-cb-${ppe.id}`}
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTogglePpe(ppe.id)}
                  className="accent-emerald-600 cursor-pointer"
                />
                <span className="text-[11px] text-neutral-700 dark:text-neutral-300 leading-none">
                  {language === 'ar' ? ppe.labelAr : ppe.labelEn}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Action Row */}
      <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 flex justify-end gap-3.5">
        <button
          id="discard-fields-btn"
          type="button"
          onClick={onCancel}
          className="px-5 py-2 border border-neutral-250 hover:bg-neutral-50 text-neutral-600 dark:bg-neutral-800 dark:border-neutral-750 dark:text-neutral-300 text-xs font-bold rounded-lg cursor-pointer"
        >
          {language === 'ar' ? 'تراجع وإغلاق' : 'Discard draft'}
        </button>
        <button
          id="save-draft-btn"
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-lg text-xs shadow-md cursor-pointer transition-all duration-150"
        >
          💾 {language === 'ar' ? 'حفظ كمسودة تصريح روتينية' : 'Save draft to records'}
        </button>
      </div>

    </form>
  );
};
