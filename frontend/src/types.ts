/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PermitType = 'HOT' | 'CONFINED' | 'HEIGHT' | 'LOTO' | 'COLD';
export type Language = 'ar' | 'en' | 'zh';

export type PermitStatus = 
  | 'DRAFT' 
  | 'PENDING_DEPT' 
  | 'HSE_REVIEW' 
  | 'ACTIVE' 
  | 'PENDING_CLOSE' 
  | 'CLOSED' 
  | 'REJECTED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actionAr: string;
  actionEn: string;
  actorName: string;
  actorRoleAr: string;
  actorRoleEn: string;
  comment: string;
}

export interface Permit extends TenantScopedRecord {
  id: string;
  title: string;
  type: PermitType;
  location: string;
  requesterName: string;
  requesterRoleAr: string;
  requesterRoleEn: string;
  description: string;
  hazards: string[];
  startDate: string;
  endDate: string;
  status: PermitStatus;
  
  // Department Approvals
  productionRequired: boolean;
  productionApproval: boolean;
  productionApprover?: string;
  productionComment?: string;
  productionApprovedAt?: string;
  
  electricalRequired: boolean;
  electricalApproval: boolean;
  electricalApprover?: string;
  electricalComment?: string;
  electricalApprovedAt?: string;
  
  // LOTO details
  lotoRequired: boolean;
  lotoLockNumber?: string;
  lotoKeyNumber?: string;
  
  // Gas test details
  gasTestRequired: boolean;
  gasO2Level?: number; // Target: 19.5% - 23.5%
  gasLELLevel?: number; // Target: < 10%
  gasCOLevel?: number; // Target: < 35 ppm
  gasTester?: string;
  gasTestedAt?: string;
  gasTestPassed?: boolean;
  
  // HSE Final Approval
  hseApproval: boolean;
  hseApprover?: string;
  hseComment?: string;
  hseApprovedAt?: string;

  // Supervisor field audit
  supervisorVerified?: boolean;
  supervisorVerifier?: string;
  supervisorVerifiedAt?: string;
  supervisorComment?: string;

  // Safety Measures & PPE
  requiredPPE: string[];
  safetyPrecautionConfirmations: {[key: string]: boolean};
  
  workers: string[];
  auditTrail: AuditLogEntry[];
}

export type SandboxRole = 'REQUESTER' | 'PRODUCTION' | 'ELECTRICAL' | 'HSE';

export type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  maxUsers: number;
  status: TenantStatus;
  description?: string;
  ownerEmail?: string;
  companyAdminId?: string;
  logoUrl?: string;
}

export interface TenantScopedRecord {
  tenantId?: string;
  [key: string]: unknown;
}

export interface UserProfile {
  empCode: string;
  password?: string;
  sandboxRole?: SandboxRole;
  username: string;
  fullNameAr: string;
  fullNameEn: string;
  fullNameZh?: string;
  roleAr: string;
  roleEn: string;
  roleZh?: string;
  departmentEn?: string;
  departmentAr?: string;
  departmentZh?: string;
  customRole?: 'SAFETY_MANAGER' | 'SAFETY_SUPERVISOR' | 'EMPLOYEE' | 'PRODUCTION_DEPT' | 'ELECTRICAL_DEPT' | 'SUPER_ADMIN';
  canCreatePermit?: boolean;
  canApproveElectrical?: boolean;
  canApproveProduction?: boolean;
  canApproveSafety?: boolean;
  permissions?: string[];
  tenantId?: string;
}

// === NEW NEBOSH-BASED EHS MODULE TYPES ===

export type IncidentType = 'NEAR_MISS' | 'ACCIDENT' | 'PROPERTY_DAMAGE' | 'ENVIRONMENTAL';
export type IncidentStatus = 'REPORTED' | 'INVESTIGATING' | 'CAPA_PENDING' | 'CLOSED';
export type HSE_Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CapaItem {
  id: string;
  actionEn: string;
  actionAr: string;
  assignedDepartmentEn: string;
  assignedDepartmentAr: string;
  dueDate: string;
  status: 'PENDING' | 'DONE';
}

export interface AttachmentInfo {
  name: string;
  type: string; // e.g. 'image/png', 'application/pdf', etc.
  dataUrl?: string; // Base64 representation of the file for persistence or viewing
  size?: string; // formatted size string e.g. "1.2 MB"
}

export interface Incident {
  id: string;
  titleEn: string;
  titleAr: string;
  type: IncidentType;
  date: string;
  time: string;
  locationEn: string;
  locationAr: string;
  descriptionEn: string;
  descriptionAr: string;
  severity: HSE_Severity;
  reportedByName: string;
  reportedByEmpCode?: string;
  reportedByRoleAr: string;
  reportedByRoleEn: string;
  status: IncidentStatus;
  
  // Root Cause Analysis (RCA) - 5 Whys
  why1Ar?: string;
  why1En?: string;
  why2Ar?: string;
  why2En?: string;
  why3Ar?: string;
  why3En?: string;
  why4Ar?: string;
  why4En?: string;
  why5Ar?: string;
  why5En?: string;
  rootCauseEn?: string;
  rootCauseAr?: string;
  
  // Corrective Actions (CAPA)
  capaActions: CapaItem[];
  closedAt?: string;
  closedBy?: string;
  attachments?: AttachmentInfo[];
}

export interface HiraControlMeasures {
  eliminationEn?: string;
  eliminationAr?: string;
  substitutionEn?: string;
  substitutionAr?: string;
  engineeringEn?: string;
  engineeringAr?: string;
  administrativeEn?: string;
  administrativeAr?: string;
  ppeEn?: string;
  ppeAr?: string;
}

export interface HiraAssessment {
  id: string;
  taskEn: string;
  taskAr: string;
  areaEn: string;
  areaAr: string;
  hazardEn: string;
  hazardAr: string;
  consequenceEn: string;
  consequenceAr: string;
  
  // 1-5 Scale Scoring
  initialLikelihood: number;
  initialSeverity: number;
  initialRiskScore: number; // Likelihood x Severity
  
  // NEBOSH Hierarchy Controls
  controls: HiraControlMeasures;
  
  // Residual risk after controls
  residualLikelihood: number;
  residualSeverity: number;
  residualRiskScore: number;
  
  status: 'DRAFT' | 'PENDING_HSE' | 'APPROVED' | 'REJECTED';
  assessedBy: string;
  date: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AuditCheckItem {
  id: string;
  labelEn: string;
  labelAr: string;
  compliance: 'COMPLIANT' | 'NON_COMPLIANT' | 'NA';
  comment?: string;
}

export interface SafetyAudit {
  id: string;
  titleEn: string;
  titleAr: string;
  conductedBy: string;
  date: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  items: AuditCheckItem[];
  score: number; // % of Compliant / (Compliant + Non-Compliant)
  correctiveActionsNeeded?: string;
}

export interface TrainingRecord {
  id: string;
  titleEn: string;
  titleAr: string;
  providerEn: string;
  providerAr: string;
  attendees: string[];
  date: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED';
}
