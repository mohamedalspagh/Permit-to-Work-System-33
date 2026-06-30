import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch
} from "firebase/firestore";
import { 
  UserProfile, 
  Permit, 
  Incident, 
  HiraAssessment, 
  SafetyAudit, 
  TrainingRecord 
} from "../types";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase config is supplied and valid (i.e. not placeholder)
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== "your-api-key"
);

let db: any = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// Helper to write a single item to Firestore
async function setFirestoreDoc(collectionName: string, id: string, data: any) {
  if (!db) return false;
  try {
    await setDoc(doc(db, collectionName, id), data);
    return true;
  } catch (error) {
    console.error(`Error saving to Firestore collection ${collectionName}:`, error);
    return false;
  }
}

// Helper to delete a single item from Firestore
async function deleteFirestoreDoc(collectionName: string, id: string) {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, collectionName, id));
    return true;
  } catch (error) {
    console.error(`Error deleting from Firestore collection ${collectionName}:`, error);
    return false;
  }
}

// Helper to fetch all items from a collection
async function getFirestoreDocs<T>(collectionName: string): Promise<T[] | null> {
  if (!db) return null;
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ ...doc.data() } as T);
    });
    return items;
  } catch (error) {
    console.error(`Error fetching from Firestore collection ${collectionName}:`, error);
    return null;
  }
}

// Helper to batch save items
async function saveFirestoreBatch<T extends { id?: string; empCode?: string }>(
  collectionName: string, 
  items: T[], 
  idKey: 'id' | 'empCode'
) {
  if (!db) return false;
  try {
    const batch = writeBatch(db);
    items.forEach((item) => {
      const id = idKey === 'empCode' ? item.empCode : item.id;
      if (id) {
        const ref = doc(db, collectionName, id);
        batch.set(ref, item);
      }
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error(`Error batch saving to ${collectionName}:`, error);
    return false;
  }
}

// --- USER OPERATIONS ---
export async function dbGetUsers(): Promise<UserProfile[] | null> {
  return getFirestoreDocs<UserProfile>('ehs_users');
}

export async function dbSaveUser(user: UserProfile) {
  return setFirestoreDoc('ehs_users', user.empCode, user);
}

export async function dbSaveUsersBatch(users: UserProfile[]) {
  return saveFirestoreBatch('ehs_users', users, 'empCode');
}

export async function dbDeleteUser(empCode: string) {
  return deleteFirestoreDoc('ehs_users', empCode);
}

// --- PERMIT OPERATIONS ---
export async function dbGetPermits(): Promise<Permit[] | null> {
  return getFirestoreDocs<Permit>('ptw_records');
}

export async function dbSavePermit(permit: Permit) {
  return setFirestoreDoc('ptw_records', permit.id, permit);
}

export async function dbSavePermitsBatch(permits: Permit[]) {
  return saveFirestoreBatch('ptw_records', permits, 'id');
}

export async function dbDeletePermit(id: string) {
  return deleteFirestoreDoc('ptw_records', id);
}

// --- INCIDENT OPERATIONS ---
export async function dbGetIncidents(): Promise<Incident[] | null> {
  return getFirestoreDocs<Incident>('ehs_incidents');
}

export async function dbSaveIncident(incident: Incident) {
  return setFirestoreDoc('ehs_incidents', incident.id, incident);
}

export async function dbSaveIncidentsBatch(incidents: Incident[]) {
  return saveFirestoreBatch('ehs_incidents', incidents, 'id');
}

export async function dbDeleteIncident(id: string) {
  return deleteFirestoreDoc('ehs_incidents', id);
}

// --- HIRA OPERATIONS ---
export async function dbGetHiras(): Promise<HiraAssessment[] | null> {
  return getFirestoreDocs<HiraAssessment>('ehs_hiras');
}

export async function dbSaveHira(hira: HiraAssessment) {
  return setFirestoreDoc('ehs_hiras', hira.id, hira);
}

export async function dbSaveHirasBatch(hiras: HiraAssessment[]) {
  return saveFirestoreBatch('ehs_hiras', hiras, 'id');
}

export async function dbDeleteHira(id: string) {
  return deleteFirestoreDoc('ehs_hiras', id);
}

// --- AUDIT OPERATIONS ---
export async function dbGetAudits(): Promise<SafetyAudit[] | null> {
  return getFirestoreDocs<SafetyAudit>('ehs_audits');
}

export async function dbSaveAudit(audit: SafetyAudit) {
  return setFirestoreDoc('ehs_audits', audit.id, audit);
}

export async function dbSaveAuditsBatch(audits: SafetyAudit[]) {
  return saveFirestoreBatch('ehs_audits', audits, 'id');
}

export async function dbDeleteAudit(id: string) {
  return deleteFirestoreDoc('ehs_audits', id);
}

// --- TRAINING OPERATIONS ---
export async function dbGetTrainings(): Promise<TrainingRecord[] | null> {
  return getFirestoreDocs<TrainingRecord>('ehs_trainings');
}

export async function dbSaveTraining(training: TrainingRecord) {
  return setFirestoreDoc('ehs_trainings', training.id, training);
}

export async function dbSaveTrainingsBatch(trainings: TrainingRecord[]) {
  return saveFirestoreBatch('ehs_trainings', trainings, 'id');
}

export async function dbDeleteTraining(id: string) {
  return deleteFirestoreDoc('ehs_trainings', id);
}
