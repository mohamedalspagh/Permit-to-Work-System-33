import React from 'react';
import { TrainingRecord, SandboxRole, Language } from '../types';
import { 
  GraduationCap, Calendar, Plus, Users, Award, AlertCircle, CheckCircle, Clock, Trash2, ArrowLeft, ShieldAlert
} from 'lucide-react';

interface TrainingManagerProps {
  trainings: TrainingRecord[];
  onAddTraining: (tr: TrainingRecord) => void;
  language: Language;
}

export const TrainingManager: React.FC<TrainingManagerProps> = ({
  trainings,
  onAddTraining,
  language
}) => {
  const [activeView, setActiveView] = React.useState<'LIST' | 'FORM'>('LIST');

  // Form states
  const [titleEn, setTitleEn] = React.useState('');
  const [titleAr, setTitleAr] = React.useState('');
  const [providerEn, setProviderEn] = React.useState('');
  const [providerAr, setProviderAr] = React.useState('');
  const [date, setDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = React.useState('');
  const [selectedAttendees, setSelectedAttendees] = React.useState<string[]>([]);
  const [attendeeName, setAttendeeName] = React.useState('');

  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName.trim()) return;
    if (!selectedAttendees.includes(attendeeName.trim())) {
      setSelectedAttendees([...selectedAttendees, attendeeName.trim()]);
    }
    setAttendeeName('');
  };

  const handleRemoveAttendee = (name: string) => {
    setSelectedAttendees(selectedAttendees.filter(a => a !== name));
  };

  const handleCreateTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !providerEn.trim()) return;

    const parsedExpiry = expiryDate || (() => {
      const d = new Date(date);
      d.setFullYear(d.getFullYear() + 2); // Default to 2 years validation
      return d.toISOString().split('T')[0];
    })();

    const isAfterNow = new Date(parsedExpiry) > new Date();

    const record: TrainingRecord = {
      id: `TR-${Math.floor(100 + Math.random() * 900)}`,
      titleEn,
      titleAr: titleAr || titleEn,
      providerEn,
      providerAr: providerAr || providerEn,
      date,
      expiryDate: parsedExpiry,
      attendees: selectedAttendees.length > 0 ? selectedAttendees : ['Eng. Ahmed Al-Monafed', 'Kamal Salem'],
      status: isAfterNow ? 'ACTIVE' : 'EXPIRED'
    };

    onAddTraining(record);

    // Reset
    setTitleEn(''); setTitleAr(''); setProviderEn(''); setProviderAr(''); setExpiryDate(''); setSelectedAttendees([]);
    setActiveView('LIST');
  };

  // Helper lists for select attendees suggestions
  const standardEmployees = [
    "Eng. Asaad Al-Shamrani",
    "Eng. Ahmed Al-Monafed",
    "Eng. Turki Al-Yousef",
    "Eng. Ali Abdullah",
    "Kamal Salem",
    "Bassem Jalal",
    "Saber Helmy",
    "Saeed Gamal"
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-orange-500" />
            <span>{language === 'ar' ? 'سجلات الكفاءة والتدريب المستمر (Competency Tracker)' : 'HSE Education & Certification Records'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar' 
              ? 'ضمان كفاءة القوى العاملة طبقا لمتطلبات نيبوش الدولية ومراقبة الفترات الزمنية لصلاحية شهادات السلامة.'
              : 'Track workforce certification validity, mandate periodic refresher trainings, and verify core compliance safety cards.'}
          </p>
        </div>

        {activeView === 'LIST' && (
          <button
            onClick={() => setActiveView('FORM')}
            className="bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'تسجيل شهادة / تدريب جديد' : 'Record Safety Training Session'}</span>
          </button>
        )}
      </div>

      {/* Overview Cards (KPIs) */}
      {activeView === 'LIST' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-805 p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-450 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">{language === 'ar' ? 'مؤهل نشط' : 'Active Cards'}</span>
              <span className="text-xl font-mono font-bold text-slate-800 dark:text-white">
                {trainings.filter(t => t.status === 'ACTIVE').length} {language === 'ar' ? 'دورات' : 'Courses'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-805 p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-450 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">{language === 'ar' ? 'منتهية الصلاحية' : 'Expired / Due Reruns'}</span>
              <span className="text-xl font-mono font-bold text-slate-800 dark:text-white">
                {trainings.filter(t => t.status === 'EXPIRED').length} {language === 'ar' ? 'دورات' : 'Sessions'}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-805 p-4 rounded-xl flex items-center gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">{language === 'ar' ? 'إجمالي الموظفين المدرجين' : 'System Staff Registered'}</span>
              <span className="text-xl font-mono font-bold text-slate-800 dark:text-white">
                {standardEmployees.length} {language === 'ar' ? 'أعضاء' : 'Engineers'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- 1. LIST TRAININGS --- */}
      {activeView === 'LIST' && (
        <div className="space-y-4">
          {trainings.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <GraduationCap className="w-12 h-12 text-slate-400 mx-auto mb-3 animate-pulse" />
              <p className="text-slate-500 text-sm">{language === 'ar' ? 'لا يوجد دورات تدريبية مسجلة.' : 'No training sessions recorded.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainings.map((tr) => (
                <div 
                  key={tr.id}
                  className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-orange-500">{tr.id}</span>
                      {tr.status === 'ACTIVE' ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded border border-emerald-200 shadow-sm flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>{language === 'ar' ? 'مؤهل ساري' : 'Active Certified'}</span>
                        </span>
                      ) : (
                        <span className="bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 text-[10px] font-bold px-2.5 py-0.5 rounded border border-red-200 shadow-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>{language === 'ar' ? 'منتهية الصلاحية (مطلوب إعادة الدورة)' : 'Expired (Rerun Required)'}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                      {language === 'ar' ? tr.titleAr : tr.titleEn}
                    </h3>

                    <div className="text-xs text-slate-500 font-semibold space-y-1">
                      <div>
                        <span>{language === 'ar' ? 'المعهد المزود:' : 'Certified Provider:'} </span>
                        <span className="text-slate-700 dark:text-slate-350">{language === 'ar' ? tr.providerAr : tr.providerEn}</span>
                      </div>
                      <div className="flex justify-between flex-wrap text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-900 mt-2">
                        <span>DATE: {tr.date}</span>
                        <span>EXPIRY: {tr.expiryDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Attendees */}
                  <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-900 space-y-1.5">
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === 'ar' ? `الموظفون المعتمدون (${tr.attendees.length}):` : `Certified Staff members (${tr.attendees.length}):`}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tr.attendees.map((at, idx) => (
                        <span 
                          key={idx} 
                          className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded font-medium border border-indigo-200/50"
                        >
                          {at}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 2. TRAINING REGISTER FORM --- */}
      {activeView === 'FORM' && (
        <form onSubmit={handleCreateTraining} className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800 font-medium">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'ar' ? 'تسجيل اعتماد تدريبي / دورة نيبوش لمجموعة موظفين' : 'HSE Competency Certificate Registration'}</span>
            <button 
              type="button" 
              onClick={() => setActiveView('LIST')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'تراجع' : 'Back to certifications'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Course / Certificate Name in English</label>
              <input 
                type="text" 
                required 
                value={titleEn}
                onChange={e => setTitleEn(e.target.value)}
                placeholder="e.g. Scaffolding Inspector Competent Person Certification"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">اسم موضوع التدريب أو الشهادة بالعربية</label>
              <input 
                type="text" 
                value={titleAr}
                onChange={e => setTitleAr(e.target.value)}
                placeholder="مثال: شهادة مستخدم كفء لشحص ميزان تفتيش سقالات البناء"
                className="text-right w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Certified Training Provider (English)</label>
              <input 
                type="text" 
                required 
                value={providerEn}
                onChange={e => setProviderEn(e.target.value)}
                placeholder="e.g. British Safety Council or SGS Auditor Partners"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">الجهة المانحة أو المعهد المعتمد بالعربية</label>
              <input 
                type="text" 
                value={providerAr}
                onChange={e => setProviderAr(e.target.value)}
                placeholder="مثال: مجلس السلامة البريطانية بالشرق الأوسط"
                className="text-right w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">session Date</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">expiry date (Typically 2-3 Years validity)</label>
              <input 
                type="date" 
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                placeholder="Leaves empty to default auto-add 2 years validation"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" 
              />
            </div>
          </div>

          {/* ATTENDEES LIST MANAGEMENT */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider border-b pb-2">{language === 'ar' ? 'إضافة الموظفين والمهندسين الحاضرين' : 'Select Training Attendees'}</h4>

            <div className="flex gap-3 items-end">
              <div className="grow">
                <span className="text-[10px] font-bold text-slate-450 text-slate-500 block mb-1">{language === 'ar' ? 'طاقم العمل المتاح بالموقع:' : 'Choose from standard EHS personnel:'}</span>
                <select 
                  value={attendeeName}
                  onChange={e => setAttendeeName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-800 dark:text-white"
                >
                  <option value="">{language === 'ar' ? '-- اختر موظف من الكشف الموصى به --' : '-- Select Engineer / Operator --'}</option>
                  {standardEmployees.map((nm, idx) => (
                    <option key={idx} value={nm}>{nm}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddAttendee}
                className="bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2.5 rounded shadow transition-all"
              >
                {language === 'ar' ? 'إدراج' : 'Add Staff'}
              </button>
            </div>

            {/* Current Added Attendees Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{language === 'ar' ? 'الحضور المستوفون بالتفصيل:' : 'Assigned Attendees list:'}</span>
              {selectedAttendees.length === 0 ? (
                <p className="text-xs text-slate-400 italic">{language === 'ar' ? 'يرجى اختيار مرافقي السلامة المنتهية أو الجدد لإيداعهم.' : 'No attendees selected yet.'}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedAttendees.map((at, idx) => (
                    <span 
                      key={idx} 
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5"
                    >
                      <span>{at}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAttendee(at)}
                        className="text-red-500 hover:text-red-700 font-mono font-bold"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveView('LIST')}
              className="px-5 py-2.5 border border-slate-250 dark:border-slate-800 rounded font-bold text-xs text-slate-500"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded shadow-md transition-all animate-none"
            >
              {language === 'ar' ? 'حفظ الدورة التدريبية' : 'Save Competency Record'}
            </button>
          </div>
        </form>
      )}

    </div>
  );
};
