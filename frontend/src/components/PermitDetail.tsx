/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Permit, SandboxRole, PermitStatus, AuditLogEntry, UserProfile, Language } from '../types';
import { PERMIT_TYPES_INFO, STATUS_INFO, STANDARD_HAZARDS, STANDARD_PPES } from '../utils/initialData';
import { PushNotificationService } from '../utils/pushNotificationService';
import { 
  CheckCircle, XCircle, Lock, Gauge, FileText, 
  User, Clock, AlertTriangle, ShieldCheck, HelpCircle,
  Construction, Trash2, Calendar, MapPin, Users, HeartHandshake,
  Award, ShieldAlert, Sparkles, UserCheck
} from 'lucide-react';

interface PermitDetailProps {
  permit: Permit;
  currentRole: SandboxRole;
  currentUser?: UserProfile;
  language: Language;
  onUpdatePermit: (updated: Permit) => void;
  onDeletePermit?: (id: string) => void;
  onBackToDashboard: () => void;
}

export const PermitDetail: React.FC<PermitDetailProps> = ({
  permit,
  currentRole,
  currentUser,
  language,
  onUpdatePermit,
  onDeletePermit,
  onBackToDashboard
}) => {
  const canActAsProduction = !!currentUser?.canApproveProduction;
  const canActAsElectrical = !!currentUser?.canApproveElectrical;
  const canActAsSafety = !!currentUser?.canApproveSafety;
  const canActAsRequester = !!currentUser?.canCreatePermit;

  // Local state for actions
  const [commentText, setCommentText] = React.useState('');
  const [lotoLock, setLotoLock] = React.useState('');
  const [lotoKey, setLotoKey] = React.useState('');
  
  // Gas test state
  const [o2, setO2] = React.useState(20.9);
  const [lel, setLel] = React.useState(0);
  const [co, setCo] = React.useState(0);
  const [gasSubmitted, setGasSubmitted] = React.useState(false);

  // Precautions check confirmation
  const [checkedPrecautions, setCheckedPrecautions] = React.useState<{[key: string]: boolean}>(
    permit.safetyPrecautionConfirmations || {}
  );

  const typeInfo = PERMIT_TYPES_INFO[permit.type];
  const statusInfo = STATUS_INFO[permit.status];

  // Helper to add audit log
  const createAuditEntry = (actionAr: string, actionEn: string, comment: string): AuditLogEntry => {
    const rolesMap: Record<SandboxRole, { ar: string, en: string, name: string }> = {
      REQUESTER: { ar: 'مشرف الفريق المنفذ', en: 'Site Requester', name: 'م. أحمد المنفذ' },
      PRODUCTION: { ar: 'مدير التشغيل والتحكم (الإنتاج)', en: 'Production Manager', name: 'م. تركي اليوسف' },
      ELECTRICAL: { ar: 'رئيس إدارة الكهرباء والـ LOTO', en: 'Electrical Manager', name: 'م. علي عبد الله' },
      HSE: { ar: 'مشرف سيفيتي (HSE Inspector)', en: 'HSE Officer', name: 'م. أسعد الشمراني' }
    };

    // Pull values from currentUser if they belong to this generic role category
    const isMatchingActor = !!currentUser;
    
    const actorName = isMatchingActor 
      ? (language === 'ar' ? currentUser.fullNameAr : currentUser.fullNameEn) 
      : rolesMap[currentRole].name;
      
    const actorRoleAr = isMatchingActor 
      ? currentUser.roleAr 
      : rolesMap[currentRole].ar;
      
    const actorRoleEn = isMatchingActor 
      ? currentUser.roleEn 
      : rolesMap[currentRole].en;
    
    return {
      id: `L-${Date.now()}`,
      timestamp: new Date().toISOString().substring(0, 16).replace('T', ' '),
      actionAr,
      actionEn,
      actorName,
      actorRoleAr,
      actorRoleEn,
      comment
    };
  };

  // HANDLERS
  
  // 1. Submit Draft
  const handleSubmitDraft = () => {
    const freshLog = createAuditEntry('تقديم طلب التصريح للاعتماد المبدئي', 'Submitted permit for approvals', 'تأكيد اكتمال متطلبات الصيانة والمقاولين الميدانية.');
    
    // Determine next state: if no department approval is required, go directly to HSE_REVIEW
    const needsDept = permit.productionRequired || permit.electricalRequired;
    const nextStatus: PermitStatus = needsDept ? 'PENDING_DEPT' : 'HSE_REVIEW';

    // Push notification logic
    const targetRole: SandboxRole = permit.productionRequired 
      ? 'PRODUCTION' 
      : (permit.electricalRequired ? 'ELECTRICAL' : 'HSE');
      
    PushNotificationService.sendNotification(
      language === 'ar' ? `🚨 طلب تصريح بانتظار الاجراء: ${permit.id}` : `🚨 Permit Awaiting Action: ${permit.id}`,
      language === 'ar'
        ? `طلب تصريح "${permit.title}" في "${permit.location}" بانتظار تدابير العزل التشغيلي والكهربائي.`
        : `Permit "${permit.title}" in "${permit.location}" is pending isolation/clearance reviews.`,
      {
        targetRole,
        permitId: permit.id,
        actionRequired: true
      }
    );

    onUpdatePermit({
      ...permit,
      status: nextStatus,
      auditTrail: [...permit.auditTrail, freshLog]
    });
  };

  // 2. Production Approval or Reject
  const handleProductionAction = (approve: boolean) => {
    if (!commentText.trim()) {
      alert(language === 'ar' ? 'الرجاء إدخال تعليق أو ملاحظة مبررة قبل الاعتماد.' : 'Please add a comment explaining your clearance review.');
      return;
    }

    const actionTextAr = approve ? 'اعتماد وإقرار التشغيل والإنتاج' : 'رفض طلب التصريح من إدارة الإنتاج';
    const actionTextEn = approve ? 'Approved production physical clearance' : 'Rejected permit by Production Administration';
    
    const freshLog = createAuditEntry(actionTextAr, actionTextEn, commentText);

    let nextStatus = permit.status;
    
    if (approve) {
      const isElectricalPending = permit.electricalRequired && !permit.electricalApproval;
      // If electrical is required but not yet approved (and not current role), keep in PENDING_DEPT. 
      // Else, if Electrical is already approved (or not required), move to HSE_REVIEW!
      nextStatus = isElectricalPending ? 'PENDING_DEPT' : 'HSE_REVIEW';
      
      // Notify next role
      if (isElectricalPending) {
        PushNotificationService.sendNotification(
          language === 'ar' ? `⚡ عزل كهربائي مطلوب: ${permit.id}` : `⚡ Electrical Isolation Needed: ${permit.id}`,
          language === 'ar'
            ? `اعتمدت إدارة الإنتاج خلو الموقع. يرجى عزل الطاقة وتثبيت أقفال LOTO.`
            : `Production clearance received. Electrical isolation & LOTO padlocks are now required.`,
          {
            targetRole: 'ELECTRICAL',
            permitId: permit.id,
            actionRequired: true
          }
        );
      } else {
        PushNotificationService.sendNotification(
          language === 'ar' ? `🛡️ معاينة ومراجعة سلامة: ${permit.id}` : `🛡️ HSE Review Required: ${permit.id}`,
          language === 'ar'
            ? `تم الحصول على موافقات الإدارات. بانتظار تدقيق السلامة وفحص الغازات.`
            : `Department clearances obtained. Awaiting HSE supervisor on-site safety checks & gas monitoring.`,
          {
            targetRole: 'HSE',
            permitId: permit.id,
            actionRequired: true
          }
        );
      }
    } else {
      nextStatus = 'REJECTED';
      
      PushNotificationService.sendNotification(
        language === 'ar' ? `❌ رفض طلب التصريح: ${permit.id}` : `❌ Permit Request Rejected: ${permit.id}`,
        language === 'ar'
          ? `تم رفض الطلب من م. تركي (الإنتاج): ${commentText}`
          : `Permit was rejected by Production Manager Turki: ${commentText}`,
        {
          targetRole: 'REQUESTER',
          permitId: permit.id,
          actionRequired: false
        }
      );
    }

    onUpdatePermit({
      ...permit,
      status: nextStatus,
      productionApproval: approve,
      productionApprover: 'م. تركي اليوسف',
      productionComment: commentText,
      productionApprovedAt: new Date().toISOString().substring(0, 16),
      auditTrail: [...permit.auditTrail, freshLog]
    });
    
    setCommentText('');
  };

  // 3. Electrical Approval with LOTO or Reject
  const handleElectricalAction = (approve: boolean) => {
    if (approve && permit.productionRequired && !permit.productionApproval) {
      alert(language === 'ar' 
        ? 'عذراً! موافقة واعتماد إدارة الإنتاج إلزامية قبل إجراء العزل الكهربائي وتطبيق LOTO.' 
        : 'Error! Production department approval and clearance are mandatory before completing electrical isolation and LOTO.');
      return;
    }
    if (approve && permit.lotoRequired && (!lotoLock.trim() || !lotoKey.trim())) {
      alert(language === 'ar' ? 'الرجاء توثيق رقم قفل العزل ورقم المفتاح لتأمين LOTO.' : 'LOTO lock and key numbers are required for physical electrical isolation.');
      return;
    }
    if (!commentText.trim()) {
      alert(language === 'ar' ? 'الرجاء إدخال تعليق مبرر لعملية عزل الطاقة.' : 'Please add a commentary details for lock isolation.');
      return;
    }

    const actionTextAr = approve 
      ? `اعتماد خطة عزل الطاقة وتطبيق قفل LOTO رقم: ${lotoLock}`
      : 'رفض طلب عزل الطاقة من قبل إدارة الكهرباء والـ LOTO';
    const actionTextEn = approve 
      ? `Acknowledged electrical safety isolation, LOTO code: ${lotoLock}`
      : 'Rejected electricity isolation request';

    const freshLog = createAuditEntry(actionTextAr, actionTextEn, commentText);

    let nextStatus = permit.status;

    if (approve) {
      const isProductionPending = permit.productionRequired && !permit.productionApproval;
      // Check if Production still needs to approve. If yes, stay in PENDING_DEPT. If no, advance to HSE_REVIEW!
      nextStatus = isProductionPending ? 'PENDING_DEPT' : 'HSE_REVIEW';
      
      if (isProductionPending) {
        PushNotificationService.sendNotification(
          language === 'ar' ? `🏗️ خلو خط التشغيل مطلوب: ${permit.id}` : `🏗️ Production Clearance Needed: ${permit.id}`,
          language === 'ar'
            ? `تم عزل اللوحات وتثبيت أقفال LOTO. يرجى إيقاف المغذيات والسيور ميكانيكياً.`
            : `Electrical LOTO complete. Awaiting Production department physical clearance.`,
          {
            targetRole: 'PRODUCTION',
            permitId: permit.id,
            actionRequired: true
          }
        );
      } else {
        PushNotificationService.sendNotification(
          language === 'ar' ? `🛡️ مراجعة وفحص سلامة: ${permit.id}` : `🛡️ HSE Review Required: ${permit.id}`,
          language === 'ar'
            ? `تم اكتمال عزل LOTO والموافقات التشغيلية. بانتظار تدقيق السلامة وفحص الغازات.`
            : `LOTO lock-out complete. Awaiting HSE supervisor on-site safety review & gas test.`,
          {
            targetRole: 'HSE',
            permitId: permit.id,
            actionRequired: true
          }
        );
      }
    } else {
      nextStatus = 'REJECTED';
      
      PushNotificationService.sendNotification(
        language === 'ar' ? `❌ رفض قفل LOTO وعزل الطاقة: ${permit.id}` : `❌ LOTO Isolation Rejected: ${permit.id}`,
        language === 'ar'
          ? `تم رفض طلب عزل الطاقة من م. علي (الكهرباء): ${commentText}`
          : `Energy isolation rejected by Electrical Manager Ali: ${commentText}`,
        {
          targetRole: 'REQUESTER',
          permitId: permit.id,
          actionRequired: false
        }
      );
    }

    onUpdatePermit({
      ...permit,
      status: nextStatus,
      electricalApproval: approve,
      electricalApprover: 'م. علي عبد الله',
      electricalComment: commentText,
      electricalApprovedAt: new Date().toISOString().substring(0, 16),
      lotoLockNumber: approve ? lotoLock : '',
      lotoKeyNumber: approve ? lotoKey : '',
      auditTrail: [...permit.auditTrail, freshLog]
    });

    setCommentText('');
  };

  // 4. HSE Gas Testing
  const handlePerformGasTest = () => {
    // Standard safety levels: O2 should be 19.5% to 23.5%. LEL < 10%. CO < 35 ppm.
    const oxygenPassed = o2 >= 19.5 && o2 <= 23.5;
    const lelPassed = lel < 10;
    const coPassed = co < 35;
    const passed = oxygenPassed && lelPassed && coPassed;

    const testComment = `قراءات الاختبار الذاتي: الأكسجين ${o2}% (${oxygenPassed ? 'آمن' : 'مخالف'})، المتفجرات LEL %${lel} (${lelPassed ? 'آمن' : 'مخالف'})، أول أكسيد الكربون ${co}ppm (${coPassed ? 'آمن' : 'مخالف'}).`;
    
    const freshLog = createAuditEntry(
      passed ? 'فحص الهواء والغازات بنجاح' : 'إجراء فحص الغازات (مؤشرات خطرة!)', 
      passed ? 'Atmospheric gas assessment completed successfully' : 'Atmospheric gas test failed safety thresholds', 
      testComment
    );

    // Notify of gas test results
    PushNotificationService.sendNotification(
      language === 'ar' ? `💨 نتيجة فحص الغازات: ${permit.id}` : `💨 Gas Test Result: ${permit.id}`,
      language === 'ar'
        ? `تم فحص الهواء: الأكسجين ${o2}%، المتفجرات %${lel}، أول أكسيد الكربون ${co}ppm. النتيجة: ${passed ? 'مطابق وآمن ✅' : 'خطرة وغير مطابقة ❌'}`
        : `Gas values: O2: ${o2}%, LEL: ${lel}%, CO: ${co}ppm. Status: ${passed ? 'Safe ✅' : 'Danger Threshold Exceeded ❌'}`,
      {
        targetRole: 'HSE',
        permitId: permit.id,
        actionRequired: passed
      }
    );

    alert(passed 
      ? (language === 'ar' ? '✅ الهواء والغازات مطابقة لمقاييس السلامة! يمكنك الآن إصدار التصريح.' : '✅ Atmospheric test bounds passed. High safety margin established.')
      : (language === 'ar' ? '❌ مستويات خطيرة للغاز الخانق، لا تصدر التصريح ودع مروحة الشفط تعمل لربع وردية!' : '❌ Dangerous respiratory metrics measured on-site! Hold authorization.')
    );

    onUpdatePermit({
      ...permit,
      gasO2Level: o2,
      gasLELLevel: lel,
      gasCOLevel: co,
      gasTestPassed: passed,
      gasTester: 'م. أسعد الشمراني',
      gasTestedAt: new Date().toISOString().substring(0, 16),
      auditTrail: [...permit.auditTrail, freshLog]
    });

    setGasSubmitted(true);
  };

  // 5. HSE Final Issue (Approve) or Reject
  const handleHseAction = (approve: boolean) => {
    if (approve && permit.gasTestRequired && !permit.gasTestPassed) {
      alert(language === 'ar' ? 'لا يمكن إصدار التصريح قبل إجراء فحص الغازات وتجاوزه بنجاح!' : 'Gas monitoring must pass safety limits prior to permit issuing.');
      return;
    }
    if (!commentText.trim()) {
      alert(language === 'ar' ? 'الرجاء تدوين التوجيهات النهائية لسلامة طاقم العمل.' : 'Please describe safety directions in your review comments.');
      return;
    }

    const actionTextAr = approve ? 'إصدار تصريح العمل واعتماده سارياً للعمل' : 'رفض نهائي لطلب التصريح بدواعي السلامة المهنية';
    const actionTextEn = approve ? 'Authorized, issued and signed active PTW' : 'Rejected permit request by HSE';

    const freshLog = createAuditEntry(actionTextAr, actionTextEn, commentText);

    // Notify requester
    if (approve) {
      PushNotificationService.sendNotification(
        language === 'ar' ? `✅ تصريح العمل جاهز ونشط: ${permit.id}` : `✅ Permit Is Now ACTIVE: ${permit.id}`,
        language === 'ar'
          ? `اعتمدت إدارة السلامة تصريح "${permit.title}" وهو جاهز لبدء العمل في الموقع تحت إشرافك.`
          : `Safety Department approved & issued permit "${permit.title}". Site work is authorized to start under EHS compliance.`,
        {
          targetRole: 'REQUESTER',
          permitId: permit.id,
          actionRequired: false
        }
      );
    } else {
      PushNotificationService.sendNotification(
        language === 'ar' ? `❌ رفض طلب التصريح نهائياً: ${permit.id}` : `❌ Permit Final Rejection: ${permit.id}`,
        language === 'ar'
          ? `تم رفض التصريح نهائياً من م. أسعد (HSE): ${commentText}`
          : `Permit was rejected by HSE Safety Supervisor Asaad: ${commentText}`,
        {
          targetRole: 'REQUESTER',
          permitId: permit.id,
          actionRequired: false
        }
      );
    }

    onUpdatePermit({
      ...permit,
      status: approve ? 'ACTIVE' : 'REJECTED',
      hseApproval: approve,
      hseApprover: 'م. أسعد الشمراني',
      hseComment: commentText,
      hseApprovedAt: new Date().toISOString().substring(0, 16),
      safetyPrecautionConfirmations: checkedPrecautions,
      auditTrail: [...permit.auditTrail, freshLog]
    });

    setCommentText('');
  };

  // 6. Requester asks for Closure
  const handleRequestClosure = () => {
    if (!commentText.trim()) {
      alert(language === 'ar' ? 'الرجاء إدخال تعليق يثبت خروج العمال وفك المحابس ميكانيكياً.' : 'Please add remarks stating workers clearance and lock dismantle requests.');
      return;
    }

    const freshLog = createAuditEntry(
      'تقديم طلب إغلاق ميكانيكي وميداني للموقع', 
      'Requested chemical cleanup and mechanical license closure', 
      commentText
    );

    // Notify HSE
    PushNotificationService.sendNotification(
      language === 'ar' ? `🧹 طلب إغلاق وتفتيش نظافة الموقع: ${permit.id}` : `🧹 Housekeeping & Closure Audit Required: ${permit.id}`,
      language === 'ar'
        ? `قام م. أحمد بإنهاء أعمال الصيانة وتصفية العمال في تصريح "${permit.title}". يرجى تفتيش الموقع وإغلاق LOTO.`
        : `Eng. Ahmed reported maintenance work complete & site cleared for permit "${permit.title}". Please inspect housekeeping & archive.`,
      {
        targetRole: 'HSE',
        permitId: permit.id,
        actionRequired: true
      }
    );

    onUpdatePermit({
      ...permit,
      status: 'PENDING_CLOSE',
      supervisorVerified: false, // Reset supervisor verification for closure audit
      auditTrail: [...permit.auditTrail, freshLog]
    });

    setCommentText('');
  };

  // 6b. Safety Supervisor Field Checkpoint Verification
  const handleSupervisorVerify = () => {
    if (permit.gasTestRequired && !permit.gasTestPassed) {
      alert(language === 'ar' ? 'لا يمكن إكمال تفقد المشرف قبل إجراء فحص الغازات وتجاوزه بنجاح!' : 'Gas monitoring must pass safety limits prior to supervisor safety confirmation.');
      return;
    }
    if (!commentText.trim()) {
      alert(language === 'ar' ? 'الرجاء إدخال توجيهات المراقبة الميدانية المعتمدة من قبلكم.' : 'Please add safety supervisor comments for the field audit record.');
      return;
    }

    const freshLog = createAuditEntry(
      'تثبت ومعاينة السلامة ميدانياً وإصدار التصريح', 
      'On-site safety checks verified and permit active release', 
      commentText
    );

    const verifierName = currentUser ? currentUser.fullNameAr : 'م. أسعد الشمراني';

    // Notify requester
    PushNotificationService.sendNotification(
      language === 'ar' ? `✅ تفعيل وتدقيق السلامة بالميدان: ${permit.id}` : `✅ Field Inspection Complete (Active): ${permit.id}`,
      language === 'ar'
        ? `أجرى المشرف ${verifierName} معاينة للموقع واعتمد سلامة التدابير الوقائية. تصريح العمل نشط الآن.`
        : `EHS Supervisor ${verifierName} completed on-site audit. The permit is now fully ACTIVE.`,
      {
        targetRole: 'REQUESTER',
        permitId: permit.id,
        actionRequired: false
      }
    );

    onUpdatePermit({
      ...permit,
      status: 'ACTIVE',
      supervisorVerified: true,
      supervisorVerifier: currentUser ? currentUser.fullNameAr : 'م. أسعد الشمراني',
      supervisorVerifiedAt: new Date().toISOString().substring(0, 16),
      supervisorComment: commentText,
      hseApproval: true,
      hseApprover: currentUser ? currentUser.fullNameAr : 'م. أسعد الشمراني',
      hseApprovedAt: new Date().toISOString().substring(0, 16),
      hseComment: commentText,
      safetyPrecautionConfirmations: checkedPrecautions,
      auditTrail: [...permit.auditTrail, freshLog]
    });

    alert(language === 'ar' ? '✓ تم تسجيل التحقق الميداني والتدابير الوقائية وتفعيل تصريح العمل بنجاح!' : '✓ Field verification completed. Permit is now ACTIVE for work.');
    setCommentText('');
  };

  // 6c. Safety Supervisor Post-Work Environmental Handover Verification
  const handleSupervisorCloseVerify = () => {
    if (!commentText.trim()) {
      alert(language === 'ar' ? 'الرجاء تدوين حالة نظافة محيط عمل الصيانة وخلو الموقع.' : 'Please add field observations concerning housekeeping and site clearance.');
      return;
    }

    const freshLog = createAuditEntry(
      'تفتيش النظافة الميدانية وإغلاق وأرشفة التصريح نهائياً', 
      'Post-work site cleanliness inspected and filed for final archival', 
      commentText
    );

    // Notify requester and department
    PushNotificationService.sendNotification(
      language === 'ar' ? `📁 تم إغلاق وأرشفة التصريح مغلقاً: ${permit.id}` : `📁 Permit Closed and Archived: ${permit.id}`,
      language === 'ar'
        ? `تم فحص نظافة موقع التصريح "${permit.title}" وتأكيد سلامة تصفية الموقع بالكامل ومغادرته.`
        : `Housekeeping audited. Permit "${permit.title}" is archived. All locks and isolating gears removed.`,
      {
        targetRole: 'REQUESTER',
        permitId: permit.id,
        actionRequired: false
      }
    );

    onUpdatePermit({
      ...permit,
      status: 'CLOSED',
      supervisorVerified: true,
      supervisorComment: `[معاينة النظافة]: ${commentText}`,
      auditTrail: [...permit.auditTrail, freshLog]
    });

    alert(language === 'ar' ? '✓ تم توثيق المعاينة الميدانية وإغلاق وأرشفة تصريح العمل بنجاح!' : '✓ Post-work checks completed and permit is archived as CLOSED.');
    setCommentText('');
  };

  // 7. HSE Closes permit permanently
  const handleFinalClose = () => {
    const confirmation = window.confirm(
      language === 'ar' 
        ? 'هل تؤكد إخلاء الموقع بالكامل من المعدات ونظافة محيط العمل، لإنهاء تفعيل التصريح وأرشفته مغلقاً؟' 
        : 'Do you confirm that workers cleared the site, gears have been cleaned, and energy locks dismantled for final permit archival?'
    );

    if (!confirmation) return;

    const freshLog = createAuditEntry(
      'معاينة الموقع وتأكيد النظافة وإغلاق التصريح نهائياً بأمان', 
      'Site audit confirmed clean, filed and closed permanently', 
      commentText || (language === 'ar' ? 'الفحص الميداني ممتاز، تمت تصفية الأقفال وإعطاء إذن معاودة التشغيل.' : 'Physical check concluded. Site is clean. Power returned.')
    );

    PushNotificationService.sendNotification(
      language === 'ar' ? `📁 إغلاق نهائي لتصريح العمل: ${permit.id}` : `📁 Permit Permanently Closed: ${permit.id}`,
      language === 'ar'
        ? `أغلق م. أسعد تصريح "${permit.title}" نهائياً وأرشيفه بأمان ومصادر الطاقة استرجعت.`
        : `HSE closed permit "${permit.title}". Electrical/hydraulic power sources restored to active operation.`,
      {
        targetRole: 'REQUESTER',
        permitId: permit.id,
        actionRequired: false
      }
    );

    onUpdatePermit({
      ...permit,
      status: 'CLOSED',
      auditTrail: [...permit.auditTrail, freshLog]
    });

    setCommentText('');
  };

  // Local helper for checking precautions
  const togglePrecaution = (preid: string) => {
    const newVal = !checkedPrecautions[preid];
    const updated = { ...checkedPrecautions, [preid]: newVal };
    setCheckedPrecautions(updated);
  };

  return (
    <div id="details-section" className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-md p-5 text-right font-sans flex flex-col gap-6">
      
      {/* 1. Header Section: Title + Navigation */}
      <div id="details-heading" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2 justify-start flex-row-reverse">
            <span className="text-xl font-bold font-mono text-orange-600 shrink-0">{permit.id}</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${typeInfo.color}`}>
              {language === 'ar' ? typeInfo.labelAr : typeInfo.labelEn}
            </span>
            <span className={`text-xs font-bold px-3 py-0.5 rounded-md border ${statusInfo.color}`}>
              {language === 'ar' ? statusInfo.labelAr : statusInfo.labelEn}
            </span>
          </div>
          <h2 id="deep-detail-title" className="text-lg font-extrabold text-neutral-900 dark:text-neutral-100 leading-snug">
            {permit.title}
          </h2>
        </div>

        <div className="flex gap-2">
          {onDeletePermit && permit.status === 'DRAFT' && canActAsRequester && (
            <button
              id="delete-draft-btn"
              onClick={() => {
                if (confirm(language === 'ar' ? 'هل أنت متأكد من حذف مسودة التصريح هذه نهائياً؟' : 'Are you sure you want to permanently delete this draft permit?')) {
                  onDeletePermit(permit.id);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-950/40 text-red-650 hover:bg-red-50 hover:text-red-700 rounded-lg text-xs font-semibold cursor-pointer transition-all"
            >
              <Trash2 id="trash-ico" className="w-4 h-4" />
              <span>{language === 'ar' ? 'مسح المسودة' : 'Delete Draft'}</span>
            </button>
          )}

          <button
            id="back-list-btn"
            onClick={onBackToDashboard}
            className="px-3.5 py-1.5 border border-neutral-200 dark:border-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-bold cursor-pointer focus:outline-none"
          >
            {language === 'ar' ? 'العودة للمؤشرات 📋' : 'Back to Dashboard 📋'}
          </button>
        </div>

      </div>

      {/* VISUAL WORKFLOW ROADMAP (خارطة مسار وسير العمل بالتصريح) */}
      <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-200 dark:border-neutral-850">
        <h4 className="text-[11px] font-black text-neutral-500 uppercase tracking-wider mb-3 select-none flex items-center justify-start gap-1.5 flex-row-reverse">
          <HelpCircle className="w-4 h-4 text-orange-500" />
          <span>{language === 'ar' ? 'خارطة مسار وخط سير تصريح العمل الرقمي (NEBOSH Workflow)' : 'Permit Lifecycle & EHS Workflow Roadmap'}</span>
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          {[
            { key: 'DRAFT', ar: '١. مسودة مبدئية', en: '1. Initial Draft' },
            { key: 'PENDING_DEPT', ar: '٢. إقرار العزل', en: '2. Dept Clearance' },
            { key: 'HSE_REVIEW', ar: '٣. مراجعة السلامة', en: '3. EHS Audit' },
            { key: 'ACTIVE', ar: '٤. تصريح نشط', en: '4. Active Permit' },
            { key: 'PENDING_CLOSE', ar: '٥. طلب الإغلاق', en: '5. Pre-Closure' },
            { key: 'CLOSED', ar: '٦. مغلق ومؤرشف', en: '6. Safety Archived' }
          ].map((step, idx) => {
            const statusesOrder: PermitStatus[] = ['DRAFT', 'PENDING_DEPT', 'HSE_REVIEW', 'ACTIVE', 'PENDING_CLOSE', 'CLOSED'];
            const currentIdx = statusesOrder.indexOf(permit.status);
            const stepIdx = statusesOrder.indexOf(step.key as PermitStatus);
            
            const isCurrent = permit.status === step.key;
            const isCompleted = stepIdx < currentIdx && permit.status !== 'REJECTED';
            
            let bgClass = 'bg-neutral-100 border-neutral-200 text-neutral-400 dark:bg-neutral-900 dark:border-neutral-850';
            let iconElement = <span className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-700" />;
            
            if (isCurrent) {
              if (permit.status === 'REJECTED') {
                bgClass = 'bg-rose-500 border-rose-500 text-white shadow-md';
                iconElement = <XCircle className="w-3.5 h-3.5 text-white" />;
              } else {
                bgClass = 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20';
                iconElement = <div className="w-2 h-2 rounded-full bg-white dark:bg-neutral-900 animate-ping" />;
              }
            } else if (isCompleted) {
              bgClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400';
              iconElement = <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />;
            }
            
            return (
              <div 
                key={step.key} 
                className={`py-2 px-2.1 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all select-none ${bgClass}`}
              >
                <div className="flex items-center gap-1.5 flex-row-reverse">
                  {iconElement}
                  <span className="text-[10px] sm:text-xs font-bold leading-tight select-none">
                    {language === 'ar' ? step.ar : step.en}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Basic Info Grid (Bento) */}
      <div id="bento-info-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="md:col-span-2 space-y-4">
          
          {/* Main Description Block */}
          <div id="description-card" className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 dark:border-neutral-900 text-right">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
              {language === 'ar' ? 'وصف تفاصيل المهمة والعملية' : 'Description of Work & Task Details'}
            </h3>
            <p id="p-desc-text" className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans">
              {permit.description}
            </p>
          </div>

          {/* Location & Times block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            <div id="location-pill" className="bg-white dark:bg-neutral-900 p-3.5 rounded-lg border border-neutral-150 dark:border-neutral-800/80 flex items-center justify-start gap-3">
              <div className="bg-orange-500/10 p-2 rounded-lg text-orange-600">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-400">{language === 'ar' ? 'محيط العمل والمنطقة' : 'Location Area'}</p>
                <p id="detail-loc" className="text-xs font-bold text-neutral-850 dark:text-neutral-200 mt-0.5">{permit.location}</p>
              </div>
            </div>

            <div id="time-pill" className="bg-white dark:bg-neutral-900 p-3.5 rounded-lg border border-neutral-150 dark:border-neutral-800/80 flex items-center justify-start gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-400">{language === 'ar' ? 'فترة الصلاحية المجدولة' : 'Validity Term'}</p>
                <p id="detail-dates" className="text-xs font-bold text-neutral-850 dark:text-neutral-200 mt-0.5 font-mono leading-none">
                  {permit.startDate.replace('T', ' ')} <br/> {language === 'ar' ? 'إلى' : 'to'} {permit.endDate.substring(11)}
                </p>
              </div>
            </div>

          </div>

          {/* Workers & Supervisor */}
          <div id="crew-card" className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800 text-right">
            <h4 id="crew-title" className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2 flex items-center justify-start gap-1">
              <Users className="w-4 h-4 text-orange-500" />
              <span>{language === 'ar' ? 'طاقم العمل الميداني المعتمد' : 'Authorized Site Crew'}</span>
            </h4>
            
            <div className="flex flex-wrap gap-2 justify-start mt-2">
              <span className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 text-neutral-700 dark:text-neutral-300 font-bold px-2 py-1 rounded text-xs select-none">
                ⚙️ {language === 'ar' ? `المشرف: ${permit.requesterName}` : `Lead: ${permit.requesterName}`}
              </span>
              {permit.workers?.map((worker, index) => (
                <span key={index} className="bg-amber-500/10 dark:bg-amber-500/5 text-amber-800 dark:text-amber-400 border border-amber-500/30 px-2 py-1 rounded text-xs">
                  👷 {worker}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Hazards & Safety Gears SideColumn */}
        <div id="hazards-gears-sidebar" className="space-y-4">
          
          {/* Hazards */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-4 rounded-xl">
            <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-start gap-1">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{language === 'ar' ? 'المخاطر المحدّدة بالتقييم' : 'Assessed Technical Hazards'}</span>
            </h4>
            <div className="flex flex-col gap-1.5 mt-2.5">
              {permit.hazards?.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">No special extreme hazard configured.</p>
              ) : (
                permit.hazards?.map((hazid) => {
                  const hazardInf = STANDARD_HAZARDS.find(h => h.id === hazid);
                  return (
                    <div key={hazid} className="flex items-start gap-2 text-xs text-right leading-relaxed bg-white dark:bg-neutral-900 border border-neutral-150 dark:border-neutral-800 p-2 rounded-lg justify-start">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                      <div>
                        <p className="font-bold text-neutral-800 dark:text-neutral-200">
                          {language === 'ar' ? hazardInf?.labelAr : hazardInf?.labelEn}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Safety PPE */}
          <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-4 rounded-xl">
            <h4 className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider mb-2 flex items-center justify-start gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ar' ? 'معدات الوقاية الشخصية (PPE)' : 'Mandated PPE Gear'}</span>
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {permit.requiredPPE?.map((ppeid) => {
                const ppe = STANDARD_PPES.find(p => p.id === ppeid);
                return (
                  <span key={ppeid} className="bg-emerald-55/6 flex items-center gap-1 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-2 py-1 rounded text-[11px] font-semibold dark:bg-emerald-950/10">
                    🛡️ {language === 'ar' ? ppe?.labelAr : ppe?.labelEn}
                  </span>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 3. Dynamic Controls Panel (Approval State Actions) */}
      <div id="dynamic-action-panel" className="border-t border-neutral-100 dark:border-neutral-800 pt-5 text-right">
        <div id="action-panel-banner" className="bg-gradient-to-r from-neutral-50 to-orange-500/5 dark:from-neutral-950 dark:to-orange-950/20 p-4 rounded-xl border border-orange-500/10 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
          <div>
            <span id="role-context-badge" className="bg-orange-500 text-white font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase select-none">
              {language === 'ar' ? 'النظام التفاعلي للصلاحية الحالية' : `ACTIVE ROLE: ${currentRole}`}
            </span>
            <p className="text-xs font-bold text-neutral-800 dark:text-neutral-205 mt-1">
              {language === 'ar' 
                ? `جاري المراجعة بصفتك: ${currentRole} - ${permit.status}`
                : `Currently inspecting permit as specialized role: ${currentRole}`}
            </p>
          </div>
          <p className="text-[11px] text-neutral-500 leading-normal max-w-md">
            {language === 'ar'
              ? 'تتغير الخيارات والمدخلات الفنية أدناه ديناميكياً لتلائم مسؤوليات الإدارة المحدّدة في شريط المحاكاة العلوي.'
              : 'Action triggers, safety checklist confirmations and isolation forms below will adapt depending on your role.'}
          </p>
        </div>

        {/* Workflow Action Modules based on State */}
        
        {/* State A: DRAFT - Requester submits */}
        {permit.status === 'DRAFT' && (
          <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h5 className="text-xs font-extrabold text-neutral-450 uppercase">{language === 'ar' ? 'تأكيد تقديم طلب تصريح العمل' : 'Submit Draft for Department Clearance'}</h5>
              <p className="text-xs text-neutral-500 mt-1">
                {language === 'ar' 
                  ? 'بتقديم هذا الطلب، سيتم إرساله للتحكم المبدئي للإدارات التشغيلية المكلّفة بالإنتاج وعزل الكهرباء LOTO.'
                  : 'By submitting, this document will queue on Production stops and Electrical LOTO isolation desks.'}
              </p>
            </div>
            
            {canActAsRequester ? (
              <button
                id="submit-requester-btn"
                onClick={handleSubmitDraft}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer transition-all focus:outline-none"
              >
                🚀 {language === 'ar' ? 'إرسال الطلب للاعتماد' : 'Submit for Approvals'}
              </button>
            ) : (
              <div className="text-xs text-neutral-400 italic">
                {language === 'ar' ? '⚠️ فقط "طالب التصريح" مخول بإرسال المسودة.' : '⚠️ Switch role to permit creator to submit.'}
              </div>
            )}
          </div>
        )}

        {/* State B: PENDING_DEPT - Department isolation */}
        {permit.status === 'PENDING_DEPT' && (
          <div className="space-y-4">
            
            {/* 1. Production Clearance Status */}
            {permit.productionRequired && (
              <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800/80 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-900 pb-2 flex-row-reverse">
                  <div className="flex items-center gap-1.5 justify-start">
                    <Construction className="w-4 h-4 text-indigo-500" />
                    <h5 className="text-xs font-extrabold text-neutral-450 uppercase">{language === 'ar' ? 'إقرار إيقاف المغذيات وخلو خطوط التشغيل (إدارة الإنتاج والتشغيل)' : 'Production Stop & Material Clearance'}</h5>
                  </div>
                  {permit.productionApproval ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                      {language === 'ar' ? `✓ معتمد من ${permit.productionApprover}` : `✓ Approved by ${permit.productionApprover}`}
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                      {language === 'ar' ? '⏳ بانتظار إقرار الإنتاج' : '⏳ Awaiting Production Clearance'}
                    </span>
                  )}
                </div>

                {permit.productionApproval ? (
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 whitespace-pre-line text-right">
                    <strong>{language === 'ar' ? 'ملاحظة الإنتاج: ' : 'Comment: '}</strong>{permit.productionComment}
                  </p>
                ) : (
                  canActAsProduction && (
                    <div className="space-y-2 mt-1">
                      <label className="block text-xs font-bold text-neutral-500 text-right">{language === 'ar' ? 'تقرير معاينة الموقع وخطة الإيقاف ميكانيكياً:' : 'Production comments & line isolation status:'}</label>
                      <textarea
                        id="prod-comment-text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={language === 'ar' ? 'اكتب تفاصيل إيقاف السيور أو تفريغ المواد وصلاحية دخول العمال للموقع...' : 'e.g. Belt feed has been stopped and conveyor SC-03 isolated from control panels...'}
                        className="w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-orange-500"
                        rows={2}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          id="prod-reject-btn"
                          onClick={() => handleProductionAction(false)}
                          className="px-4 py-1.5 border border-red-200 hover:bg-red-50 text-red-650 font-bold rounded-lg text-xs cursor-pointer focus:outline-none"
                        >
                          ❌ {language === 'ar' ? 'رفض التصريح ومطالبة بتأجيل الصيانة' : 'Reject Draft'}
                        </button>
                        <button
                          id="prod-approve-btn"
                          onClick={() => handleProductionAction(true)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow focus:outline-none"
                        >
                          ✓ {language === 'ar' ? 'اعتماد وخلو الإنتاج' : 'Approve Clearance'}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* 2. Electrical Isolation & LOTO */}
            {permit.electricalRequired && (
              <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 dark:border-neutral-800/80 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-900 pb-2 flex-row-reverse">
                  <div className="flex items-center gap-1.5 justify-start">
                    <Lock className="w-4 h-4 text-purple-500" />
                    <h5 className="text-xs font-extrabold text-neutral-450 uppercase">{language === 'ar' ? 'إجراء عزل الطاقة والـ LOTO وتأمين اللوحات (إدارة الكهرباء)' : 'Electrical Safety & Lockout/Tagout (LOTO)'}</h5>
                  </div>
                  {permit.electricalApproval ? (
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                      {language === 'ar' ? `✓ قفل برقم: ${permit.lotoLockNumber} معتمد` : `✓ Lock: ${permit.lotoLockNumber} Approved`}
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-800 border border-rose-250 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse">
                      {language === 'ar' ? '⏳ بانتظار عزل الطاقة LOTO' : '⏳ Awaiting Isolation Locks'}
                    </span>
                  )}
                </div>

                {permit.electricalApproval ? (
                  <div className="grid grid-cols-2 gap-3 text-xs text-neutral-600 bg-white dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-100 text-right">
                    <p><strong>{language === 'ar' ? 'رقم قفل الأمان: ' : 'Lock ID: '}</strong>{permit.lotoLockNumber}</p>
                    <p><strong>{language === 'ar' ? 'رقم مفتاح التحكم: ' : 'Key ID: '}</strong>{permit.lotoKeyNumber}</p>
                    <p className="col-span-2 pt-1 border-t border-neutral-100"><strong>{language === 'ar' ? 'تقرير الكهرباء: ' : 'Comment: '}</strong>{permit.electricalComment}</p>
                  </div>
                ) : (
                  canActAsElectrical && (
                    <div className="space-y-3 mt-1 text-right">
                      {permit.productionRequired && !permit.productionApproval && (
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-3 rounded-lg text-xs font-bold text-right flex items-center gap-2 flex-row-reverse">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-bounce" />
                          <span className="text-amber-700 dark:text-amber-300">
                            {language === 'ar' 
                              ? 'تنبيه هام: موافقة واعتماد إدارة الإنتاج إلزامية أولاً قبل تفعيل العزل الكهربائي وتطبيق LOTO.' 
                              : 'Important Notice: Production department approval is strictly mandatory before starting electrical isolation and LOTO.'}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'رقم قفل العزل الفعلي (LOTO Lock No):' : 'LOTO Lock Lockout ID:'}</label>
                          <input
                            id="loto-lock-input"
                            type="text"
                            disabled={permit.productionRequired && !permit.productionApproval}
                            value={lotoLock}
                            onChange={(e) => setLotoLock(e.target.value)}
                            placeholder="e.g. LOTO-E-401"
                            className={`w-full text-xs p-2 bg-white dark:bg-neutral-900 border rounded-lg focus:outline-none ${
                              permit.productionRequired && !permit.productionApproval
                                ? 'border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
                                : 'border-neutral-200 dark:border-neutral-800'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-500 mb-1">{language === 'ar' ? 'رقم مفتاح صندوق المحولات (Safety Key No):' : 'LOTO Safety Control Key No:'}</label>
                          <input
                            id="loto-key-input"
                            type="text"
                            disabled={permit.productionRequired && !permit.productionApproval}
                            value={lotoKey}
                            onChange={(e) => setLotoKey(e.target.value)}
                            placeholder="e.g. KEY-401-A"
                            className={`w-full text-xs p-2 bg-white dark:bg-neutral-900 border rounded-lg focus:outline-none ${
                              permit.productionRequired && !permit.productionApproval
                                ? 'border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
                                : 'border-neutral-200 dark:border-neutral-800'
                            }`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-neutral-500">{language === 'ar' ? 'تقرير وخطوات عزل مصادر التيار عن المغذيات:' : 'Lock remarks & terminal switches isolated:'}</label>
                        <textarea
                          id="elec-comment-text"
                          disabled={permit.productionRequired && !permit.productionApproval}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={language === 'ar' ? 'اكتب تفاصيل سحب المفاتيح وقطع التغذية وتجربة الضغط العكسي للموتور...' : 'e.g. Isolated MCC motor breaker and chained locking chain onto physical panel block...'}
                          className={`w-full text-xs p-2.5 bg-white dark:bg-neutral-900 border rounded-lg focus:outline-none focus:border-orange-500 ${
                            permit.productionRequired && !permit.productionApproval
                              ? 'border-neutral-200 dark:border-neutral-800 opacity-60 cursor-not-allowed'
                              : 'border-neutral-200 dark:border-neutral-800'
                          }`}
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <button
                          id="elec-reject-btn"
                          disabled={permit.productionRequired && !permit.productionApproval}
                          onClick={() => handleElectricalAction(false)}
                          className={`px-4 py-1.5 border font-bold rounded-lg text-xs cursor-pointer focus:outline-none ${
                            permit.productionRequired && !permit.productionApproval
                              ? 'border-neutral-200 dark:border-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                              : 'border-red-200 hover:bg-red-50 text-red-650'
                          }`}
                        >
                          ❌ {language === 'ar' ? 'رفض وإصدار مخالفة عزل' : 'Refuse Installation'}
                        </button>
                        <button
                          id="elec-approve-btn"
                          disabled={permit.productionRequired && !permit.productionApproval}
                          onClick={() => handleElectricalAction(true)}
                          className={`px-4 py-1.5 font-bold rounded-lg text-xs cursor-pointer shadow focus:outline-none transition-all ${
                            permit.productionRequired && !permit.productionApproval
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed border border-neutral-300 dark:border-neutral-700'
                              : 'bg-purple-600 hover:bg-purple-500 text-white'
                          }`}
                        >
                          🔑 {language === 'ar' ? 'إقرار العزل وتأكيد القفل' : 'Apply Isolation Lock'}
                        </button>
                      </div>
                    </div>
                  )
                )}

              </div>
            )}

            {!canActAsProduction && !canActAsElectrical && (
              <p className="text-center text-xs text-neutral-400 italic">
                {language === 'ar' ? '🔒 يجب تبديل الدور أو امتلاك صلاحيات الإنتاج/الكهرباء لاعتماد العزل والخطوات التشغيلية.' : '🔒 Switch roles or obtain Production/Electrical approvals to process clearance.'}
              </p>
            )}

          </div>
        )}

        {/* State C: HSE_REVIEW - Safety Specialist signs */}
        {permit.status === 'HSE_REVIEW' && (
          <div className="space-y-4">
            
            {/* Confined space Entry Gas test if required */}
            {permit.gasTestRequired && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-right space-y-3">
                <div className="flex items-center gap-1.5 justify-start border-b border-amber-500/10 pb-2 flex-row-reverse">
                  <Gauge className="w-5 h-5 text-amber-500" />
                  <h5 className="text-xs font-extrabold text-amber-700 dark:text-amber-400 uppercase">
                    {language === 'ar' ? 'جهاز قياس وتحليل غازات الغلاف الجوي المحيط' : 'Confined space gas assessment & analysis'}
                  </h5>
                </div>
                
                {permit.gasTestPassed ? (
                  <div className="grid grid-cols-3 gap-3 bg-white dark:bg-neutral-900 border border-emerald-250 p-3 rounded-lg text-center font-mono">
                    <div className="text-emerald-700">
                      <p className="text-[10px] text-neutral-400 uppercase font-sans font-bold">{language === 'ar' ? 'غاز الأكسجين O₂ (OXYGEN)' : 'O2 (19.5% - 23.5%)'}</p>
                      <p className="text-lg font-bold">{permit.gasO2Level}%</p>
                      <p className="text-[9px] font-bold">PASS</p>
                    </div>
                    <div className="text-emerald-700">
                      <p className="text-[10px] text-neutral-400 uppercase font-sans font-bold">{language === 'ar' ? 'غاز المتفجرات LEL' : 'LEL (< 10%)'}</p>
                      <p className="text-lg font-bold">{permit.gasLELLevel}%</p>
                      <p className="text-[9px] font-bold">PASS</p>
                    </div>
                    <div className="text-emerald-700">
                      <p className="text-[10px] text-neutral-400 uppercase font-sans font-bold">{language === 'ar' ? 'أول أكسيد الكربون CO' : 'CO (< 35 ppm)'}</p>
                      <p className="text-lg font-bold">{permit.gasCOLevel}ppm</p>
                      <p className="text-[9px] font-bold">PASS</p>
                    </div>
                    <p className="col-span-3 text-xs font-semibold text-neutral-500 dark:text-emerald-400 border-t border-neutral-100 pt-1 text-right font-sans">
                      {language === 'ar' ? `المفتش: ${permit.gasTester} بتاريخ ${permit.gasTestedAt}` : `Inspector: ${permit.gasTester} @ ${permit.gasTestedAt}`}
                    </p>
                  </div>
                ) : (
                  canActAsSafety ? (
                    <div className="space-y-3">
                      <p className="text-xs text-neutral-500">
                        {language === 'ar' 
                          ? 'كعنصر من إجراءات الأماكن المغلقة، قم بقياس مستويات الأكسجين (المستهدف ١٩.٥-٢٣.٥٪)، الغاز المتفجر LEL (المستهدف أصغر من ١٠٪) والكربون CO (أصغر من ٣٥ جزء بالمليون) لتأمين بيئة التنفس.' 
                          : 'Verify that safe gas levels have been established before authorizing workforce entry.'}
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-500 mb-1">O₂ Level (%):</label>
                          <input
                            id="o2-gas-input"
                            type="number"
                            step="0.1"
                            value={o2}
                            onChange={(e) => setO2(parseFloat(e.target.value) || 0)}
                            className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-250 rounded-lg font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-500 mb-1">LEL Level (%):</label>
                          <input
                            id="lel-gas-input"
                            type="number"
                            value={lel}
                            onChange={(e) => setLel(parseInt(e.target.value) || 0)}
                            className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-250 rounded-lg font-mono text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-500 mb-1">CO Level (ppm):</label>
                          <input
                            id="co-gas-input"
                            type="number"
                            value={co}
                            onChange={(e) => setCo(parseInt(e.target.value) || 0)}
                            className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-250 rounded-lg font-mono text-center"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          id="gas-test-action-btn"
                          onClick={handlePerformGasTest}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs cursor-pointer focus:outline-none"
                        >
                          🧪 {language === 'ar' ? 'إجراء فحص الهواء بالسينسور' : 'Perform Safe Gas Test'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-xs p-3 border border-dashed border-amber-300 text-amber-800 rounded bg-amber-50/20">
                      {language === 'ar' ? '⏳ بانتظار تبديل الدور أو امتلاك صلاحيات مسؤول السلامة (HSE) لإتمام قراءات الغاز.' : '⏳ Awaiting HSE specialist role or permissions to register Gas readings.'}
                    </div>
                  )
                )}

              </div>
            )}

            {/* General Precautions Checkboxes for HSE to sign */}
            {canActAsSafety && (
              <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 p-4 rounded-xl text-right">
                <h5 className="text-xs font-extrabold text-neutral-500 mb-2">{language === 'ar' ? 'التثبت الميداني من التدابير الوقائية:' : 'Verify Precautionary Safeguards Checklist:'}</h5>
                <div className="flex flex-col gap-2 mt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer justify-start">
                    <input
                      id="pp-chk-loto"
                      type="checkbox"
                      checked={!!checkedPrecautions['loto_chk']}
                      onChange={() => togglePrecaution('loto_chk')}
                      className="mt-1 accent-orange-650 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300">
                      {language === 'ar' ? 'عزل كلي تام وتأكيد إغلاق أقفال LOTO واللوحات معزولة فيزيائياً' : 'Physical electrical LOTO locks are securely in place'}
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer justify-start">
                    <input
                      id="pp-chk-ppe"
                      type="checkbox"
                      checked={!!checkedPrecautions['ppe_chk']}
                      onChange={() => togglePrecaution('ppe_chk')}
                      className="mt-1 accent-orange-650 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300">
                      {language === 'ar' ? 'التحقق من ارتداء طاقم العمل لمعدات الوقاية المحددة لخطورة العمل لسلامتهم' : 'All workers strictly dressed in mandatory task PPEs'}
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer justify-start">
                    <input
                      id="pp-chk-ext"
                      type="checkbox"
                      checked={!!checkedPrecautions['fire_ext']}
                      onChange={() => togglePrecaution('fire_ext')}
                      className="mt-1 accent-orange-650 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300">
                      {language === 'ar' ? 'تأمين معدات الإطفاء أو التهوية الكافية ميكانيكياً بالمحيط لمجابهة الحريق' : 'Fire extinguishers and support ventilation are deployed'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* HSE Comment & Action */}
            {canActAsSafety ? (
              <div className="space-y-4 mt-2 text-right">
                
                {permit.supervisorVerified && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-right flex items-center gap-2 flex-row-reverse shadow-inner">
                    <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-450 leading-tight">
                        {language === 'ar' ? `✓ معتمد ميدانياً بواسطة مشرف السلامة: ${permit.supervisorVerifier}` : `✓ On-site checks verified by HSE Supervisor: ${permit.supervisorVerifier}`}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        {language === 'ar' ? `توجيهات المشرف: ${permit.supervisorComment}` : `Supervisor remarks: ${permit.supervisorComment}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-3 flex-row-reverse">
                  <div className="flex items-center gap-1.5 justify-start">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ar' 
                        ? `الدخول الحالي: @${currentUser?.username} (${currentUser?.roleAr})` 
                        : `Current Account: @${currentUser?.username} (${currentUser?.roleEn})`}
                    </span>
                  </div>
                </div>

                <label className="block text-xs font-bold text-neutral-500">
                  {language === 'ar' ? 'توجيهات السلامة الميدانية والمصادقة:' : 'General safety directives & release remarks:'}
                </label>
                <textarea
                  id="hse-comment-box"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب شروط الاستخدام الميداني، مثل: تفقد الحزام الدائم، نسبة الإضاءة، طفاية البودرة، أجهزة المراقبة الأوتوماتيكية...' : 'e.g. Approved. Standby watcher must be deployed at the entry. Lifelines on. Keep detector live...'}
                  className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg focus:outline-none focus:border-orange-500"
                  rows={2}
                />
                
                <div className="flex gap-2 justify-end">
                  <button
                    id="hse-reject-btn"
                    onClick={() => handleHseAction(false)}
                    className="px-5 py-2 hover:bg-red-50 text-red-650 border border-red-200 font-bold rounded-lg text-xs cursor-pointer focus:outline-none"
                  >
                    ❌ {language === 'ar' ? 'رفض الطلب بالكامل' : 'Formal HSE Reject'}
                  </button>

                  <button
                    id="hse-issue-btn"
                    onClick={handleSupervisorVerify}
                    className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-550 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md focus:outline-none flex items-center justify-center gap-1"
                  >
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>{language === 'ar' ? '✓ تأكيد المعاينة وإصدار تصريح العمل' : '✓ Confirm On-Site Checks & Issue Permit'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs p-4 border border-dashed border-neutral-200 text-neutral-450 bg-neutral-50 rounded-lg">
                {language === 'ar' 
                  ? '⚠️ يرجى تبديل الدور أو حساب الدخول إلى مسؤول سلامة (مشرف سيفيتي) لاعتماد التدابير الوقائية وتوقيع العبور.' 
                  : '⚠️ Technical compliance authority needed. Please login as HSE supervisor to sign checks.'}
              </div>
            )}

          </div>
        )}

        {/* State D: ACTIVE - Requester closes work when completed */}
        {permit.status === 'ACTIVE' && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-right space-y-3">
            <div className="flex items-center gap-1.5 justify-start flex-row-reverse">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0" />
              <h5 className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 uppercase">
                {language === 'ar' ? 'التصريح ساري لعمل الصيانة بالتنسيق الميداني' : 'Permit is Active - Operation In Progress'}
              </h5>
            </div>
            
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {language === 'ar'
                ? 'يخضع موقع الصيانة لمراقبة السلامة الدائمة. عند الانتهاء من العمل وتأمين المعدات، يجب على "طالب التصريح" تقديم طلب إغلاق التصريح للمراجعة وإعادة قفل الكهرباء.'
                : 'Work crew is performing active task on-site. Once completed, cleanup the location, fetch coworkers, and request final license closure.'}
            </p>

            {canActAsRequester ? (
              <div className="space-y-2 pt-2 border-t border-emerald-500/10">
                <label className="block text-[11px] font-bold text-neutral-500">{language === 'ar' ? 'ملاحظة تسليم المعاينة وتنظيف محيط الموقع ميكانيكياً:' : 'Handover comments & site cleanliness confirm:'}</label>
                <textarea
                  id="close-req-comment"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب بياناً يؤكد خروج كامل العمال، فك الأقفال المؤقتة، ونظافة المخلفات...' : 'e.g. Maintenance accomplished. Hand tools collected, area cleared and safe to operate...'}
                  className="w-full text-xs p-2 bg-white dark:bg-neutral-900 border border-neutral-200 rounded focus:outline-none focus:border-emerald-500"
                  rows={2}
                />
                <div className="flex justify-end">
                  <button
                    id="request-close-action-btn"
                    onClick={handleRequestClosure}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded text-xs cursor-pointer focus:outline-none shadow"
                  >
                    🧹 {language === 'ar' ? 'إرسال طلب إغلاق التصريح ميكانيكياً' : 'Submit Closure Request'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-450 italic pt-1 border-t border-emerald-500/10">
                {language === 'ar' ? '⏳ غيّم صلاحيتك أو امتلك صلاحيات طالب التصريح لإنهاء الوردية وطلب الإغلاق.' : '⏳ Switch role or obtain permit creator permissions to trigger close.'}
              </p>
            )}
          </div>
        )}

        {/* State E: PENDING_CLOSE - HSE performs cleanup audit */}
        {permit.status === 'PENDING_CLOSE' && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-right space-y-3">
            <div className="flex items-center gap-1.5 justify-start flex-row-reverse">
              <span className="w-2.5 h-2.5 bg-purple-500 rounded-full shrink-0" />
              <h5 className="text-xs font-extrabold text-purple-700 dark:text-purple-400">
                {language === 'ar' ? 'طلب فحص النظافة بعد الصيانة (بانتظار المراجعة)' : 'Pending Site Cleanup & Permanent Closure Audit'}
              </h5>
            </div>
            
            <p className="text-xs text-neutral-600 dark:text-neutral-400">
              {language === 'ar'
                ? 'قدم طالب التصريح إقراراً بانتهاء الصيانة وخروج العمال ومعالجة مخلفات اللحام أو القطع. يجب على مسؤول السلامة (HSE) مراجعة محيط المصنع وتأكيد الإغلاق والأرشفة.'
                : 'Requester stated work crew cleared, tools removed. HSE officer must audit the physical environment and register permanent closure.'}
            </p>

            {canActAsSafety ? (
              <div className="space-y-4 pt-2 border-t border-purple-500/20 text-right">
                
                {permit.supervisorComment && (
                  <div className="bg-purple-100/40 dark:bg-purple-955/20 border border-purple-200 rounded-lg p-3 text-right text-xs">
                    <p className="font-bold text-purple-800 dark:text-purple-400">
                      {language === 'ar' ? '✓ تقرير المعاينة الميدانية للمشرف:' : '✓ Supervisor Housekeeping confirmation report:'}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1">
                      {permit.supervisorComment}
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 flex items-center justify-between gap-3 flex-row-reverse">
                  <div className="flex items-center gap-1.5 justify-start">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {language === 'ar' 
                        ? `الدخول الحالي: @${currentUser?.username} (${currentUser?.roleAr})` 
                        : `Current Account: @${currentUser?.username} (${currentUser?.roleEn})`}
                    </span>
                  </div>
                </div>

                <label className="block text-xs font-bold text-neutral-500">{language === 'ar' ? 'تقرير التفتيش الميداني وصندوق السلامة:' : 'HSE auditor permanent close remarks:'}</label>
                <textarea
                  id="final-close-comment-box"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={language === 'ar' ? 'ملاحظات المعاينة الميدانية لإغلاق تصاريح العمل وأرشفتها بنجاح...' : 'e.g. Audit complete. No hazard remains on work site. Safety locks returned. Power authorized to start...'}
                  className="w-full text-xs p-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded focus:outline-none focus:border-purple-505"
                  rows={2}
                />
                
                <div className="flex justify-end">
                  <button
                    id="final-archive-close-btn"
                    onClick={handleSupervisorCloseVerify}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow focus:outline-none flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>{language === 'ar' ? '✓ تسجيل المعاينة وإغلاق وأرشفة التصريح نهائياً' : '✓ Confirm Site Cleanup & Close Permanently'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs p-4 border border-dashed border-neutral-200 text-neutral-450 bg-neutral-50 rounded-lg">
                {language === 'ar' ? '⚠️ يرجى تبديل الدور أو حساب الدخول إلى مسؤول سلامة (مشرف سيفيتي) لإنهاء الفحص وإغلاق التصريح.' : '⚠️ Switch simulation role to HSE (Supervisor) to sign environmental checks and close permit.'}
              </div>
            )}
          </div>
        )}

        {/* State F: CLOSED & REJECTED */}
        {(permit.status === 'CLOSED' || permit.status === 'REJECTED') && (
          <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-xl border border-neutral-150 text-center">
            {permit.status === 'CLOSED' ? (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-450 flex items-center justify-center gap-1.5 font-sans">
                <CheckCircle className="w-4 h-4" />
                <span>{language === 'ar' ? 'هذا التصريح مؤرشف بكافة سجلاته التاريخية ومغلق بأمان.' : 'This Permit to Work is fully filed and archived safely.'}</span>
              </p>
            ) : (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-450 flex items-center justify-center gap-1.5 font-sans">
                <XCircle className="w-4 h-4" />
                <span>{language === 'ar' ? 'تم رفض طلب التصريح هذا من قبل الجهات المختصة ولن يتم تفعيله.' : 'This PTW is formally Rejected by specialized department.'}</span>
              </p>
            )}
          </div>
        )}

      </div>

      {/* 4. Steps Progress & Audit Trail Timeline */}
      <div id="audit-trail-section" className="border-t border-neutral-100 dark:border-neutral-800 pt-5">
        <h4 id="audit-title" className="text-sm font-extrabold text-neutral-800 dark:text-neutral-250 mb-4 flex items-center justify-start gap-1.5">
          <FileText className="w-4 h-4 text-orange-500" />
          <span>{language === 'ar' ? 'السجل الإلكتروني وتعليقات المراجعة تزامناً مع الطوابع (Audit Trail)' : 'Electronic Audit Trail & Timestamps'}</span>
        </h4>

        <div className="space-y-4">
          {permit.auditTrail?.slice().reverse().map((log) => (
            <div key={log.id} id={`audit-timeline-item-${log.id}`} className="relative pl-6 pr-4 py-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-900 rounded-xl text-right flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
              
              {/* Vertical line indicator */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500/40 to-amber-500/10 rounded-tr rounded-br" />

              <div className="space-y-1.5 w-full">
                <div className="flex flex-wrap items-center justify-between gap-1.5 flex-row-reverse">
                  <p className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">
                    {language === 'ar' ? log.actionAr : log.actionEn}
                  </p>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-neutral-400 flex-row-reverse">
                    <Clock id="clock-ico" className="w-3.5 h-3.5" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {language === 'ar' ? `${log.actorName} (${log.actorRoleAr})` : `${log.actorName} (${log.actorRoleEn})`}
                </p>

                {log.comment && (
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-850 p-2 rounded-lg italic">
                    {log.comment}
                  </p>
                )}
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
