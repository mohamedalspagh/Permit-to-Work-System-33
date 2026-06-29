import React from 'react';
import { HiraAssessment, HiraControlMeasures, SandboxRole, Language } from '../types';
import { 
  Shield, Brain, CheckSquare, Plus, Trash2, MapPin, 
  User, CheckCircle, XCircle, AlertCircle, FileText, ChevronRight, ArrowLeft 
} from 'lucide-react';

interface HiraManagerProps {
  hiras: HiraAssessment[];
  onAddHira: (hira: HiraAssessment) => void;
  onUpdateHira: (hira: HiraAssessment) => void;
  onDeleteHira: (id: string) => void;
  currentRole: SandboxRole;
  language: Language;
}

export const HiraManager: React.FC<HiraManagerProps> = ({
  hiras,
  onAddHira,
  onUpdateHira,
  onDeleteHira,
  currentRole,
  language
}) => {
  const [activeView, setActiveView] = React.useState<'LIST' | 'FORM' | 'DETAIL'>('LIST');
  const [selectedHiraId, setSelectedHiraId] = React.useState<string | null>(null);

  // Form states
  const [taskEn, setTaskEn] = React.useState('');
  const [taskAr, setTaskAr] = React.useState('');
  const [areaEn, setAreaEn] = React.useState('Kiln Preheater Tower');
  const [areaAr, setAreaAr] = React.useState('برج التسخين المسبق للفرن');
  const [hazardEn, setHazardEn] = React.useState('');
  const [hazardAr, setHazardAr] = React.useState('');
  const [consequenceEn, setConsequenceEn] = React.useState('');
  const [consequenceAr, setConsequenceAr] = React.useState('');

  // 5x5 Likelihood and Severity
  const [likelihood, setLikelihood] = React.useState<number>(3);
  const [severity, setSeverity] = React.useState<number>(3);

  // Hierarchy controls
  const [eliminationEn, setEliminationEn] = React.useState('');
  const [eliminationAr, setEliminationAr] = React.useState('');
  const [substitutionEn, setSubstitutionEn] = React.useState('');
  const [substitutionAr, setSubstitutionAr] = React.useState('');
  const [engineeringEn, setEngineeringEn] = React.useState('');
  const [engineeringAr, setEngineeringAr] = React.useState('');
  const [administrativeEn, setAdministrativeEn] = React.useState('');
  const [administrativeAr, setAdministrativeAr] = React.useState('');
  const [ppeEn, setPpeEn] = React.useState('');
  const [ppeAr, setPpeAr] = React.useState('');

  // Residual scores after controls
  const [resLikelihood, setResLikelihood] = React.useState<number>(1);
  const [resSeverity, setResSeverity] = React.useState<number>(2);

  const activeHira = hiras.find(h => h.id === selectedHiraId);

  const handleCreateHira = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskEn.trim()) return;

    const newHira: HiraAssessment = {
      id: `HIRA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      taskEn,
      taskAr: taskAr || taskEn,
      areaEn,
      areaAr: areaAr || areaEn,
      hazardEn,
      hazardAr: hazardAr || hazardEn,
      consequenceEn,
      consequenceAr: consequenceAr || consequenceEn,
      initialLikelihood: likelihood,
      initialSeverity: severity,
      initialRiskScore: likelihood * severity,
      controls: {
        eliminationEn: eliminationEn || undefined,
        eliminationAr: eliminationAr || undefined,
        substitutionEn: substitutionEn || undefined,
        substitutionAr: substitutionAr || undefined,
        engineeringEn: engineeringEn || undefined,
        engineeringAr: engineeringAr || undefined,
        administrativeEn: administrativeEn || undefined,
        administrativeAr: administrativeAr || undefined,
        ppeEn: ppeEn || undefined,
        ppeAr: ppeAr || undefined
      },
      residualLikelihood: resLikelihood,
      residualSeverity: resSeverity,
      residualRiskScore: resLikelihood * resSeverity,
      status: 'PENDING_HSE',
      assessedBy: 'Eng. Ahmed Al-Monafed',
      date: new Date().toISOString().split('T')[0]
    };

    onAddHira(newHira);
    
    // reset
    setTaskEn(''); setTaskAr(''); setHazardEn(''); setHazardAr(''); setConsequenceEn(''); setConsequenceAr('');
    setLikelihood(3); setSeverity(3); setResLikelihood(1); setResSeverity(2);
    setEliminationEn(''); setEliminationAr(''); setSubstitutionEn(''); setSubstitutionAr('');
    setEngineeringEn(''); setEngineeringAr(''); setAdministrativeEn(''); setAdministrativeAr(''); setPpeEn(''); setPpeAr('');

    setActiveView('LIST');
  };

  const handleApproveHira = (id: string, approve: boolean) => {
    const target = hiras.find(h => h.id === id);
    if (!target) return;

    const updated: HiraAssessment = {
      ...target,
      status: approve ? 'APPROVED' : 'REJECTED',
      approvedBy: approve ? 'Eng. Asaad Al-Shamrani (HSE HSE Leader)' : undefined,
      approvedAt: approve ? new Date().toISOString().split('T')[0] : undefined
    };

    onUpdateHira(updated);
    if (selectedHiraId === id) {
      setActiveView('LIST');
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 15) return 'bg-red-500 text-white dark:bg-red-950/70 border-red-650';
    if (score >= 8) return 'bg-amber-500 text-slate-900 dark:bg-yellow-900 text-yellow-300 border-amber-600';
    return 'bg-emerald-500 text-white dark:bg-emerald-950/70 border-emerald-650';
  };

  const getRiskLevelText = (score: number) => {
    if (score >= 15) return language === 'ar' ? 'خطر حرج (عالي) | High Critical' : 'High Critical | خطر حرج';
    if (score >= 8) return language === 'ar' ? 'متوسط المقبولية | Medium Risk' : 'Medium Risk | متوسط';
    return language === 'ar' ? 'مقبول (آمن) | Low Risk' : 'Low Risk | مقبول';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-orange-500" />
            <span>{language === 'ar' ? 'تحديد المخاطر وتقييمها (HIRA - ISO 45001)' : 'HIRA Assessment Tool (ISO 45001 / NEBOSH)'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ar' 
              ? 'إنشاء مصفوفة المخاطر الميدانية، وتطبيق الهرم الرقابي للتحكم (Hierarchy of Controls)، والحد من الحوادث.'
              : 'Conduct 5x5 Likelihood/Severity risk matrix analyses and map Hierarchy of Controls safeguard measures.'}
          </p>
        </div>

        {activeView === 'LIST' && (
          <button
            onClick={() => setActiveView('FORM')}
            className="bg-orange-500 hover:bg-orange-600 font-bold text-white text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm select-none transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إجراء تقييم مخاطر HIRA جديد' : 'New HIRA Audit Risk Matrix'}</span>
          </button>
        )}
      </div>

      {/* --- 1. LIST ASSESSMENT VIEWS --- */}
      {activeView === 'LIST' && (
        <div className="space-y-4">
          {hiras.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">{language === 'ar' ? 'لا توجد تقييمات مخاطر مسجلة.' : 'No HIRAs created yet.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {hiras.map((hira) => (
                <div 
                  key={hira.id}
                  onClick={() => {
                    setSelectedHiraId(hira.id);
                    setActiveView('DETAIL');
                  }}
                  className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-orange-500 rounded-xl p-5 hover:shadow-md cursor-pointer transition-all flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="space-y-2 grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">{hira.id}</span>
                      <span className="text-[10px] sm:text-xs font-bold bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                        {language === 'ar' ? hira.areaAr : hira.areaEn}
                      </span>
                      {hira.status === 'APPROVED' ? (
                        <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 rounded-full">{language === 'ar' ? 'معتمد ومؤمن' : 'Approved'}</span>
                      ) : (
                        <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 rounded-full">{language === 'ar' ? 'قيد مراجعة السلامة' : 'Pending Review'}</span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                      {language === 'ar' ? hira.taskAr : hira.taskEn}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{language === 'ar' ? 'محرر من قبل:' : 'Assessed by:'} {hira.assessedBy}</span>
                      <span>{hira.date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 min-w-[150px] shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                    <div className="text-center w-1/2">
                      <div className="text-[10px] text-slate-400 tracking-wider uppercase font-bold">{language === 'ar' ? 'خطر مبدئي' : 'Initial Risk'}</div>
                      <div className={`mt-1 font-mono font-bold text-sm px-2 py-1 rounded text-center border ${getRiskScoreColor(hira.initialRiskScore)}`}>
                        {hira.initialRiskScore}
                      </div>
                    </div>

                    <div className="text-center w-1/2">
                      <div className="text-[10px] text-slate-400 tracking-wider uppercase font-bold">{language === 'ar' ? 'خطر متبقي' : 'Residual'}</div>
                      <div className={`mt-1 font-mono font-bold text-sm px-2 py-1 rounded text-center border ${getRiskScoreColor(hira.residualRiskScore)}`}>
                        {hira.residualRiskScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 2. HIRA FORM CREATION --- */}
      {activeView === 'FORM' && (
        <form onSubmit={handleCreateHira} className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{language === 'ar' ? 'إجراء تقييم مخاطر HIRA ميداني' : 'HIRA Matrix Composer Form'}</span>
            <button 
              type="button" 
              onClick={() => setActiveView('LIST')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center gap-1 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'تراجع' : 'Back to assessments'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-l-2 border-l-indigo-500 pl-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'وصف المهمة / الوظيفة بالإنجليزية' : 'Task / Job Description in English'}</label>
              <input 
                type="text" 
                required 
                value={taskEn} 
                onChange={e => setTaskEn(e.target.value)}
                placeholder="e.g. Replacing high-voltage fan drive rotor blades"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-white focus:ring-2 focus:ring-orange-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'وصف المهمة بالعربية' : 'المهمة المطلوب تقييمها بالعربية'}</label>
              <input 
                type="text" 
                value={taskAr} 
                onChange={e => setTaskAr(e.target.value)}
                placeholder="مثال: تبديل شفرات دوّار مروحة السحب والترشيح الرئيسية"
                className="text-right w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-white focus:ring-2 focus:ring-orange-500" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'الخطر المترتب بالإنجليزية' : 'Identified Hazard in English'}</label>
              <input 
                type="text" 
                required 
                value={hazardEn} 
                onChange={e => setHazardEn(e.target.value)}
                placeholder="e.g. Mechanical entrapment, crushed fingers, falling into pulley space"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'الخطر بالعربية' : 'تحديد الخطر الرئيسي بدقة'}</label>
              <input 
                type="text" 
                value={hazardAr} 
                onChange={e => setHazardAr(e.target.value)}
                placeholder="مثال: الانحشار الميكانيكي تحت شفرات المروحة أو تحركها فجأة"
                className="text-right w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:ring-2 focus:ring-orange-500" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'العواقب بالإنجليزية' : 'Worst Possible Consequence (English)'}</label>
              <input 
                type="text" 
                required 
                value={consequenceEn} 
                onChange={e => setConsequenceEn(e.target.value)}
                placeholder="e.g. Amputation of hand, severe trauma from rotating impact"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'العواقب بالعربية' : 'أسوأ عاقبة محتملة لعدم وجود ضوابط'}</label>
              <input 
                type="text" 
                value={consequenceAr} 
                onChange={e => setConsequenceAr(e.target.value)}
                placeholder="مثال: بتر في الأطراف أو تهتك جلدي جراء دوران غير مخطط للمروحة"
                className="text-right w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">{language === 'ar' ? 'منطقة العمل بالمصنع' : 'Work Area / Machinery Location'}</label>
              <select 
                value={areaEn} 
                onChange={e => {
                  setAreaEn(e.target.value);
                  if (e.target.value === 'Kiln Preheater Tower') setAreaAr('برج التسخين المسبق للفرن');
                  else if (e.target.value === 'Raw Material Silos') setAreaAr('صوامع تخزين المواد الخام');
                  else if (e.target.value === 'High-Voltage Switchgear Room') setAreaAr('غرفة مفاتيح قواطع الجهد العالي');
                  else setAreaAr('منطقة مطاحن إسمنت الكلنكر 2');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
              >
                <option value="Kiln Preheater Tower">Kiln Preheater Tower | برج تسخين الفرن</option>
                <option value="Raw Material Silos">Raw Material Silos | صوامع المواد الخام</option>
                <option value="High-Voltage Switchgear Room">High-Voltage Switchgear Room | غرفة التحكم والجهد العالي</option>
                <option value="Cement Grinding Mill 2">Cement Grinding Mill 2 | مطحنة الإسمنت الخط الثاني</option>
              </select>
            </div>
          </div>

          {/* 5x5 Matrix selection */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Brain className="w-4 h-4" />
              <span>{language === 'ar' ? '1. تقييم كود الخطر المبدئي (5x5 Risk Assessment Matrix)' : '1. Initial 5x5 Hazard Score Assessment'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'ar' ? `احتمالية حدوث الخطر (الاحتمالية: ${likelihood} من 5)` : `Probability Matrix: Likelihood (${likelihood} of 5)`}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setLikelihood(n)}
                        className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                          likelihood === n 
                            ? 'bg-indigo-650 bg-indigo-600 text-white border-indigo-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                    <span>{language === 'ar' ? 'مستحيل تقريبًا' : 'Very Unlikely (1)'}</span>
                    <span>{language === 'ar' ? 'مؤكد الحدوث' : 'Highly Likely (5)'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {language === 'ar' ? `خطورة الضرر المحتملة (الخطورة: ${severity} من 5)` : `Hazard Severity: Severity (${severity} of 5)`}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSeverity(n)}
                        className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                          severity === n 
                            ? 'bg-indigo-600 text-white border-indigo-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-150'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                    <span>{language === 'ar' ? 'طفيف (بلا ضياع وقت)' : 'Negligible (1)'}</span>
                    <span>{language === 'ar' ? 'كارثي (وفاة/عاهة)' : 'Catastrophic (5)'}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center p-4 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'تقييم الخطر الكلي المبدئي' : 'Calculated Risk Rating'}</span>
                <span className={`text-4xl font-mono font-bold px-5 py-2.5 rounded-xl border mt-2 shadow-inner select-none ${getRiskScoreColor(likelihood * severity)}`}>
                  {likelihood * severity}
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-neutral-400 mt-2">
                  {getRiskLevelText(likelihood * severity)}
                </span>
              </div>
            </div>
          </div>

          {/* Hierarchy of Controls Section */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4" />
              <span>{language === 'ar' ? '2. الهرمية المعتمدة للتحكم في المخاطر (Hierarchy of Controls)' : '2. Mapping Hierarchy of Controls (NEBOSH Standards)'}</span>
            </h4>
            <p className="text-xs text-slate-400 leading-normal">{language === 'ar' ? 'تعديل بيئة العمل تبدأ تنازليا من الإزالة البدنية للخطر وتختتم كدعم ثانوي بمعدات الوقاية الشخصية.' : 'Prioritize physical elimination & engineering systems over mere procedural warnings or PPE.'}</p>

            <div className="space-y-4 pt-1">
              
              {/* Elimination */}
              <div className="border-l-4 border-l-red-500 pl-3 py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>1. ELIMINATION | إزالة مادية ملموسة للتهديد</span>
                  <span className="text-[10px] text-slate-400 font-normal">{language === 'ar' ? 'إزالة الخطر تمامًا' : 'Safest methodology'}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input type="text" value={eliminationEn} onChange={e => setEliminationEn(e.target.value)} placeholder="Elimination measures (English)" className="text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800 text-slate-800 dark:text-white" />
                  <input type="text" value={eliminationAr} onChange={e => setEliminationAr(e.target.value)} placeholder="إجراءات إزالة الخطر بالعربية" className="text-right text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                </div>
              </div>

              {/* Substitution */}
              <div className="border-l-4 border-l-amber-500 pl-3 py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>2. SUBSTITUTION | استبدال مادة بمادة ومعدة أقل ضرراً</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input type="text" value={substitutionEn} onChange={e => setSubstitutionEn(e.target.value)} placeholder="Substitution methods (English)" className="text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                  <input type="text" value={substitutionAr} onChange={e => setSubstitutionAr(e.target.value)} placeholder="الاستبدال بالعربية" className="text-right text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                </div>
              </div>

              {/* Engineering Controls */}
              <div className="border-l-4 border-l-indigo-500 pl-3 py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>3. ENGINEERING CONTROLS | التحكم الهندسي (حواجز، عزل، تهوية)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input type="text" value={engineeringEn} onChange={e => setEngineeringEn(e.target.value)} placeholder="Engineering measures (English)" className="text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                  <input type="text" value={engineeringAr} onChange={e => setEngineeringAr(e.target.value)} placeholder="التحكم الهندسي والتهوية بالعربية" className="text-right text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                </div>
              </div>

              {/* Administrative */}
              <div className="border-l-4 border-l-sky-500 pl-3 py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>4. ADMINISTRATIVE CONTROLS | التحكم الإداري (تناوب، تصاريح، تدريب)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input type="text" value={administrativeEn} onChange={e => setAdministrativeEn(e.target.value)} placeholder="Administrative measures (English)" className="text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                  <input type="text" value={administrativeAr} onChange={e => setAdministrativeAr(e.target.value)} placeholder="التحكمات الإدارية وتناوب الورديات" className="text-right text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                </div>
              </div>

              {/* PPE */}
              <div className="border-l-4 border-l-emerald-500 pl-3 py-1 space-y-2">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>5. PERSONAL PROTECTIVE EQUIPMENT (PPE) | معدات الوقاية الشخصية</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input type="text" value={ppeEn} onChange={e => setPpeEn(e.target.value)} placeholder="Required PPE (English)" className="text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                  <input type="text" value={ppeAr} onChange={e => setPpeAr(e.target.value)} placeholder="معدات الوقاية المطلوبة بدقة بالعربية" className="text-right text-xs p-2 rounded bg-white border border-slate-200 dark:bg-slate-950 dark:border-slate-800" />
                </div>
              </div>

            </div>
          </div>

          {/* Residual risk */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-orange-500" />
              <span>{language === 'ar' ? '3. تقييم كود الخطر المتبقي (Expected Residual Risk Rating)' : '3. Final Residual Risk Rating After Safeguards'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {language === 'ar' ? `الاحتمالية المتبقية (${resLikelihood} من 5)` : `Residual Likelihood (${resLikelihood} of 5)`}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setResLikelihood(n)}
                        className={`py-1 text-xs font-mono font-bold rounded border transition-colors ${
                          resLikelihood === n 
                            ? 'bg-orange-600 text-white border-orange-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 block mb-1">
                    {language === 'ar' ? `الخطورة المتبقية (${resSeverity} من 5)` : `Residual Severity (${resSeverity} of 5)`}
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setResSeverity(n)}
                        className={`py-1 text-xs font-mono font-bold rounded border transition-colors ${
                          resSeverity === n 
                            ? 'bg-orange-600 text-white border-orange-700' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center items-center p-4 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'ar' ? 'الخطر المتبقي المقدر' : 'Residual Rating'}</span>
                <span className={`text-3xl font-mono font-bold px-4 py-1.5 rounded-lg border mt-2 ${getRiskScoreColor(resLikelihood * resSeverity)}`}>
                  {resLikelihood * resSeverity}
                </span>
                <span className="text-xs text-slate-500 font-bold mt-1">
                  {getRiskLevelText(resLikelihood * resSeverity)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveView('LIST')}
              className="px-5 py-2 rounded font-bold text-xs text-slate-500 border border-slate-250 dark:border-slate-800 hover:bg-slate-50"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-650 text-white font-bold text-xs rounded shadow transition-all"
            >
              {language === 'ar' ? 'إرسال للمراجعة والاعتماد' : 'Submit HIRA for HSE Signoff'}
            </button>
          </div>
        </form>
      )}

      {/* --- 3. AUDIT / HIRA DETAILED VIEW WITH WORKFLOW APPROVALS --- */}
      {activeView === 'DETAIL' && activeHira && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-150 dark:border-slate-800">
            <button 
              onClick={() => setActiveView('LIST')}
              className="text-slate-500 hover:text-slate-850 dark:hover:text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'العودة لتقييمات HIRA' : 'Back to HIRAs'}</span>
            </button>

            {currentRole === 'HSE' && activeHira.status === 'PENDING_HSE' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApproveHira(activeHira.id, false)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-1.5 rounded flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'رفض' : 'Reject'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveHira(activeHira.id, true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'اعتماد التقييم' : 'Approve & Standardize'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
            <div>
              <span className="font-mono text-xs font-bold text-orange-500 uppercase tracking-wider">{activeHira.id}</span>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                {language === 'ar' ? activeHira.taskAr : activeHira.taskEn}
              </h3>
            </div>

            <div className="flex gap-4 p-3 bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-900 rounded-lg text-xs">
              <div className="w-1/2">
                <span className="font-bold text-slate-500 uppercase tracking-widest">{language === 'ar' ? 'المنطقة:' : 'Assessed Area:'}</span>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-300">{language === 'ar' ? activeHira.areaAr : activeHira.areaEn}</p>
              </div>
              <div className="w-1/2">
                <span className="font-bold text-slate-500 uppercase tracking-widest">{language === 'ar' ? 'محرر من قبل:' : 'Assessor Details:'}</span>
                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-300">{activeHira.assessedBy} • {activeHira.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg text-sm">
                <span className="font-bold text-red-500 flex items-center gap-1.5 mb-1 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{language === 'ar' ? 'الخطر المعزول المحدد مسبقاً' : 'Core Identified Hazard'}</span>
                </span>
                <p className="font-medium text-slate-700 dark:text-slate-300">{language === 'ar' ? activeHira.hazardAr : activeHira.hazardEn}</p>
              </div>

              <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg text-sm">
                <span className="font-bold text-red-500 flex items-center gap-1.5 mb-1 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>{language === 'ar' ? 'عاقبة المخاطرة الفورية' : 'Potential Consequence'}</span>
                </span>
                <p className="font-medium text-slate-700 dark:text-slate-300">{language === 'ar' ? activeHira.consequenceAr : activeHira.consequenceEn}</p>
              </div>
            </div>
          </div>

          {/* Hierarchy details read-only panel */}
          <div className="p-5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b pb-2">{language === 'ar' ? 'تدابير السيطرة المطبقة (Hierarchy Control Matrix)' : 'Applied Safeguards & Safety Barrier Matrix'}</h4>

            <div className="space-y-4 text-xs font-sans">
              {[
                { label: 'ELIMINATION | إزالة مادية', keyEn: 'eliminationEn', keyAr: 'eliminationAr', color: 'border-l-red-500 bg-red-50/15 dark:bg-red-950/5' },
                { label: 'SUBSTITUTION | استبدال فني', keyEn: 'substitutionEn', keyAr: 'substitutionAr', color: 'border-l-amber-500 bg-amber-50/15' },
                { label: 'ENGINEERING CONTROLS | تحكم هندسي', keyEn: 'engineeringEn', keyAr: 'engineeringAr', color: 'border-l-indigo-500 bg-indigo-50/15' },
                { label: 'ADMINISTRATIVE CONTROLS | تدابير ورقية وتدريب', keyEn: 'administrativeEn', keyAr: 'administrativeAr', color: 'border-l-sky-500 bg-sky-50/15' },
                { label: 'PPE | معدات الوقاية الشخصية الوقائية', keyEn: 'ppeEn', keyAr: 'ppeAr', color: 'border-l-emerald-500' }
              ].map((lvl, index) => {
                const textEn = activeHira.controls[lvl.keyEn as keyof HiraControlMeasures];
                const textAr = activeHira.controls[lvl.keyAr as keyof HiraControlMeasures];

                return (
                  <div key={index} className={`border-l-4 ${lvl.color} p-3 rounded bg-slate-50/50 dark:bg-slate-950`}>
                    <strong className="text-slate-650 font-bold block mb-1 text-[11px] text-slate-600 dark:text-slate-450">{lvl.label}</strong>
                    {textEn ? (
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200 leading-normal">{textEn}</p>
                        <p className="text-slate-400 text-[11px] text-right mt-1 font-semibold">{textAr}</p>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">{language === 'ar' ? 'غير مطلوب أو غير قابل للتطبيق لهذه المهمة.' : 'No control mapped in this level.'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scoring Summary Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl grid grid-cols-2 gap-4">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-950 rounded text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'تقييم الخطر المبدئي' : 'Initial Likelihood × Severity'}</span>
              <span className="text-base font-mono font-bold text-slate-500 block mt-1">{activeHira.initialLikelihood} × {activeHira.initialSeverity}</span>
              <span className={`inline-block mt-1.5 font-bold font-mono text-sm px-3 py-1 rounded border ${getRiskScoreColor(activeHira.initialRiskScore)}`}>
                {activeHira.initialRiskScore} ({getRiskLevelText(activeHira.initialRiskScore).split('|')[0].trim()})
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-950 rounded text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{language === 'ar' ? 'تقييم الخطر المتبقي' : 'Residual Likelihood × Severity'}</span>
              <span className="text-base font-mono font-bold text-slate-500 block mt-1">{activeHira.residualLikelihood} × {activeHira.residualSeverity}</span>
              <span className={`inline-block mt-1.5 font-bold font-mono text-sm px-3 py-1 rounded border ${getRiskScoreColor(activeHira.residualRiskScore)}`}>
                {activeHira.residualRiskScore} ({getRiskLevelText(activeHira.residualRiskScore).split('|')[0].trim()})
              </span>
            </div>
          </div>

          {activeHira.approvedBy && (
            <div className="bg-emerald-50 dark:bg-emerald-950/25 border-l-4 border-l-emerald-500 p-4 rounded-lg text-xs" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <strong className="text-emerald-800 dark:text-emerald-450 font-bold block mb-1">{language === 'ar' ? 'توثيق الاعتماد والتوحيد النهائي:' : 'HIRA Approval Documentation Record:'}</strong>
              <p className="text-slate-700 dark:text-slate-350">{language === 'ar' ? `تم اعتماد ضوابط السيطرة وتعميمها كمعيار آمن للأعمال الميدانية بواسطة الكابتن: ${activeHira.approvedBy} في الأجندّة: ${activeHira.approvedAt}` : `HIRA is certified as part of standard safety works. Standardized by safety lead ${activeHira.approvedBy} on ${activeHira.approvedAt}`}</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
