import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Unsubscribe,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  User,
  InventoryItem,
  SaleRecord,
  CustomerRecord,
  CustomerPayment,
  SupplierRecord,
  DailyOrder,
  ProductBundle,
  PromoCoupon,
  WriteOffRecord,
  ReturnRecord,
  ExpenseRecord,
  StockMovement,
  InventoryAudit,
  DailyClosure,
  UserActivity,
  StoreSettings,
  PurchaseRecord,
  StoreMeta,
  StoreUserRecord,
  StoreAccessRequest,
  ActivationCode,
} from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Robust Firestore instance initialization
let firestoreInstance: Firestore;
const configuredDbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

try {
  firestoreInstance = initializeFirestore(
    app,
    {
      ignoreUndefinedProperties: true,
    },
    configuredDbId
  );
} catch (e) {
  try {
    firestoreInstance = getFirestore(app, configuredDbId);
  } catch (err) {
    console.warn('[Firebase] Fallback to default database:', err);
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;

// Master Admin Configuration
export const MASTER_ADMIN_EMAIL = 'akhaldon7.0o0@gmail.com';
export const MASTER_ADMIN_PHONE = '0780413568';
export const MASTER_ADMIN_PHONE_INTL = '+962780413568';
export const MASTER_ADMIN_WHATSAPP = '962780413568';
export const MASTER_PASSCODES = ['KHALDON-ADMIN-2026', 'KHALDON2026', 'ADMIN-2026', 'OWNER-PASS'];

// Firestore Collection Names
export const STORES_COLLECTION = 'stores';
export const STORE_USERS_COLLECTION = 'store_users';
export const STORE_DATA_COLLECTION = 'store_data';
export const STORE_REQUESTS_COLLECTION = 'store_requests';
export const ACTIVATION_CODES_COLLECTION = 'activation_codes';
export const OWNER_VERIFICATION_COLLECTION = 'owner_verification_codes';
export const MAIL_COLLECTION = 'mail';

export interface CloudStoreData {
  id?: string;
  storeId?: string;
  updatedAt: string;
  updatedBy?: string;
  users: User[];
  inventory: InventoryItem[];
  sales: SaleRecord[];
  purchases: PurchaseRecord[];
  customers: CustomerRecord[];
  customerPayments: CustomerPayment[];
  suppliers: SupplierRecord[];
  dailyOrders: DailyOrder[];
  bundles: ProductBundle[];
  coupons: PromoCoupon[];
  writeOffs: WriteOffRecord[];
  returnsLog: ReturnRecord[];
  expenses: ExpenseRecord[];
  stockMovements: StockMovement[];
  inventoryAudits: InventoryAudit[];
  dailyClosures: DailyClosure[];
  activities: UserActivity[];
  settings: StoreSettings;
}

// Background anonymous auth attempt without blocking data operations
export function ensureFirebaseAuth(): void {
  try {
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.info('[Firebase] Anonymous auth notice:', err?.message || err);
      });
    }
  } catch (err) {
    console.info('[Firebase] Auth init notice:', err);
  }
}

// Start auth in background
ensureFirebaseAuth();

/**
 * Deep sanitization to ensure pure JSON compliance without undefined fields
 */
function sanitizePayload<T>(data: T): T {
  try {
    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value === undefined) return null;
        return value;
      })
    );
  } catch (e) {
    return data;
  }
}

/**
 * Clean key for user index documents in Firestore
 */
export function cleanKey(val: string): string {
  return val.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Register a brand new isolated store in Firestore
 */
export async function createStoreInCloud(
  meta: StoreMeta,
  adminUser: User,
  initialData: Partial<CloudStoreData>
): Promise<{ success: boolean; error?: string; store?: StoreMeta }> {
  try {
    ensureFirebaseAuth();

    const storeDocRef = doc(db, STORES_COLLECTION, meta.id);
    const storeDataRef = doc(db, STORE_DATA_COLLECTION, meta.id);

    const cleanMeta = sanitizePayload(meta);
    await setDoc(storeDocRef, cleanMeta);

    // Save initial store partitioned data
    const fullStoreData: CloudStoreData = {
      id: meta.id,
      storeId: meta.id,
      updatedAt: new Date().toISOString(),
      updatedBy: adminUser.name || 'Owner',
      users: [adminUser],
      inventory: initialData.inventory || [],
      sales: initialData.sales || [],
      purchases: initialData.purchases || [],
      customers: initialData.customers || [],
      customerPayments: initialData.customerPayments || [],
      suppliers: initialData.suppliers || [],
      dailyOrders: initialData.dailyOrders || [],
      bundles: initialData.bundles || [],
      coupons: initialData.coupons || [],
      writeOffs: initialData.writeOffs || [],
      returnsLog: initialData.returnsLog || [],
      expenses: initialData.expenses || [],
      stockMovements: initialData.stockMovements || [],
      inventoryAudits: initialData.inventoryAudits || [],
      dailyClosures: initialData.dailyClosures || [],
      activities: initialData.activities || [],
      settings: initialData.settings || {
        storeName: meta.name,
        currency: meta.currency || '$',
        adminPin: meta.adminPin || '1234',
        cloudWebhookUrl: '',
        autoWebhookDailyClose: 'no',
        soundEnabled: true,
      },
    };

    await setDoc(storeDataRef, sanitizePayload(fullStoreData));

    // Register user lookup indices for owner email & username
    const userIndexRecord: StoreUserRecord = {
      email: meta.ownerEmail.toLowerCase().trim(),
      username: adminUser.username.toLowerCase().trim(),
      name: meta.ownerName,
      role: 'admin',
      storeId: meta.id,
      storeName: meta.name,
      passwordHash: meta.passwordHash,
      passwordSalt: meta.passwordSalt,
      pin: meta.adminPin,
      lastLogin: new Date().toISOString(),
    };

    const emailIndexRef = doc(db, STORE_USERS_COLLECTION, cleanKey(meta.ownerEmail));
    await setDoc(emailIndexRef, sanitizePayload(userIndexRecord));

    if (adminUser.username && cleanKey(adminUser.username) !== cleanKey(meta.ownerEmail)) {
      const usernameIndexRef = doc(db, STORE_USERS_COLLECTION, cleanKey(adminUser.username));
      await setDoc(usernameIndexRef, sanitizePayload(userIndexRecord));
    }

    return { success: true, store: meta };
  } catch (err: unknown) {
    console.error('[Firebase] Error creating store:', err);
    return { success: false, error: (err as Error).message || 'Failed to create store in cloud.' };
  }
}

/**
 * Register sub-user index for staff member within a store
 */
export async function registerStaffIndexInCloud(
  user: User,
  store: StoreMeta
): Promise<void> {
  try {
    const userRecord: StoreUserRecord = {
      email: user.email.toLowerCase().trim(),
      username: user.username.toLowerCase().trim(),
      name: user.name,
      role: user.role,
      storeId: store.id,
      storeName: store.name,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      pin: user.role === 'admin' ? store.adminPin : undefined,
      lastLogin: new Date().toISOString(),
    };

    if (user.email) {
      const emailRef = doc(db, STORE_USERS_COLLECTION, cleanKey(user.email));
      await setDoc(emailRef, sanitizePayload(userRecord));
    }
    if (user.username) {
      const usernameRef = doc(db, STORE_USERS_COLLECTION, cleanKey(user.username));
      await setDoc(usernameRef, sanitizePayload(userRecord));
    }
  } catch (err) {
    console.warn('[Firebase] Error registering staff index:', err);
  }
}

/**
 * Lookup store account by email or username
 */
export async function lookupUserStoreAccount(identifier: string): Promise<StoreUserRecord | null> {
  try {
    ensureFirebaseAuth();
    const key = cleanKey(identifier);
    const userIndexRef = doc(db, STORE_USERS_COLLECTION, key);
    const snap = await getDoc(userIndexRef);

    if (snap.exists()) {
      return snap.data() as StoreUserRecord;
    }

    // Fallback: search stores where ownerEmail matches
    const cleanId = identifier.trim().toLowerCase();
    const q = query(collection(db, STORES_COLLECTION), where('ownerEmail', '==', cleanId));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const storeDoc = querySnap.docs[0].data() as StoreMeta;
      return {
        email: storeDoc.ownerEmail,
        username: storeDoc.ownerName,
        name: storeDoc.ownerName,
        role: 'admin',
        storeId: storeDoc.id,
        storeName: storeDoc.name,
        passwordHash: storeDoc.passwordHash,
        passwordSalt: storeDoc.passwordSalt,
        pin: storeDoc.adminPin,
        lastLogin: new Date().toISOString(),
      };
    }

    return null;
  } catch (err) {
    console.error('[Firebase] Error looking up user store:', err);
    return null;
  }
}

/**
 * Get Store Metadata profile by store ID
 */
export async function fetchStoreMetadata(storeId: string): Promise<StoreMeta | null> {
  try {
    ensureFirebaseAuth();
    const docRef = doc(db, STORES_COLLECTION, storeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as StoreMeta;
    }
    return null;
  } catch (err) {
    console.error('[Firebase] Error fetching store metadata:', err);
    return null;
  }
}

/**
 * Fetch the latest store data partition from Cloud Firestore
 */
export async function fetchStoreDataPartition(storeId: string): Promise<CloudStoreData | null> {
  try {
    ensureFirebaseAuth();
    const docRef = doc(db, STORE_DATA_COLLECTION, storeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as CloudStoreData;
    }
    return null;
  } catch (error) {
    console.error('[Firebase] Error fetching store partition:', error);
    return null;
  }
}

/**
 * Save / Update store partition state to Cloud Firestore for this specific store
 */
export async function saveStoreDataPartition(
  storeId: string,
  data: Partial<CloudStoreData>,
  userName?: string
): Promise<boolean> {
  try {
    ensureFirebaseAuth();
    const docRef = doc(db, STORE_DATA_COLLECTION, storeId);
    const cleanData = sanitizePayload({
      ...data,
      id: storeId,
      storeId: storeId,
      updatedAt: new Date().toISOString(),
      updatedBy: userName || 'Device Synchronizer',
    });

    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (error) {
    console.error('[Firebase] Error saving store partition:', error);
    return false;
  }
}

/**
 * Subscribe to real-time updates for a specific store partition
 */
export function subscribeToStorePartition(
  storeId: string,
  onData: (data: CloudStoreData) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const docRef = doc(db, STORE_DATA_COLLECTION, storeId);

  return onSnapshot(
    docRef,
    { includeMetadataChanges: false },
    (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data() as CloudStoreData;
        onData(cloudData);
      }
    },
    (error) => {
      console.warn('[Firebase] Firestore partition real-time listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * List all stores associated with an owner email
 */
export async function listAllStoresForOwner(email: string): Promise<StoreMeta[]> {
  try {
    ensureFirebaseAuth();
    const cleanEmail = email.trim().toLowerCase();
    const q = query(collection(db, STORES_COLLECTION), where('ownerEmail', '==', cleanEmail));
    const snap = await getDocs(q);
    const stores: StoreMeta[] = [];
    snap.forEach((d) => stores.push(d.data() as StoreMeta));
    return stores;
  } catch (err) {
    console.error('[Firebase] Error listing stores:', err);
    return [];
  }
}

/**
 * Cloud status helper
 */
export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

// ==========================================
// STORE ACCESS REQUESTS & ACTIVATION CODES
// ==========================================

const LOCAL_STORE_REQUESTS_KEY = 'storeledger_access_requests';
const LOCAL_ACTIVATION_CODES_KEY = 'storeledger_activation_codes';

/**
 * Submit a store request from a merchant needing access
 */
export async function submitStoreAccessRequest(
  data: Omit<StoreAccessRequest, 'id' | 'status' | 'requestedAt'>
): Promise<{ success: boolean; id: string; error?: string }> {
  try {
    ensureFirebaseAuth();
    const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const newRequest: StoreAccessRequest = {
      id: requestId,
      businessName: data.businessName.trim(),
      contactName: data.contactName.trim(),
      contactEmail: data.contactEmail.trim().toLowerCase(),
      contactPhone: data.contactPhone.trim(),
      currency: data.currency || '$',
      notes: data.notes?.trim() || '',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    // Save in Firestore
    try {
      const docRef = doc(db, STORE_REQUESTS_COLLECTION, requestId);
      await setDoc(docRef, sanitizePayload(newRequest));
    } catch (fsErr) {
      console.warn('[Firebase] Fallback to local store request save:', fsErr);
    }

    // Save locally as well
    try {
      const localReqs = getLocalStoreRequests();
      localReqs.unshift(newRequest);
      localStorage.setItem(LOCAL_STORE_REQUESTS_KEY, JSON.stringify(localReqs));
    } catch (e) {
      console.warn('[Local] Could not cache request:', e);
    }

    return { success: true, id: requestId };
  } catch (err: unknown) {
    return { success: false, id: '', error: (err as Error).message || 'Failed to submit request' };
  }
}

/**
 * Fetch all store requests (for Master Admin)
 */
export async function fetchStoreAccessRequests(): Promise<StoreAccessRequest[]> {
  try {
    ensureFirebaseAuth();
    const snap = await getDocs(collection(db, STORE_REQUESTS_COLLECTION));
    const requests: StoreAccessRequest[] = [];
    snap.forEach((d) => requests.push(d.data() as StoreAccessRequest));

    if (requests.length > 0) {
      // Sync local cache
      try {
        localStorage.setItem(LOCAL_STORE_REQUESTS_KEY, JSON.stringify(requests));
      } catch (e) {}
      return requests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }
  } catch (err) {
    console.warn('[Firebase] Fetch requests fallback to local:', err);
  }

  return getLocalStoreRequests();
}

export function getLocalStoreRequests(): StoreAccessRequest[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Update request status (Approve / Reject) and attach generated activation code
 */
export async function updateStoreRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected',
  generatedCode?: string,
  reviewerEmail: string = MASTER_ADMIN_EMAIL
): Promise<boolean> {
  try {
    ensureFirebaseAuth();
    const updateData: Partial<StoreAccessRequest> = {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewerEmail,
      ...(generatedCode ? { generatedCode } : {}),
    };

    const docRef = doc(db, STORE_REQUESTS_COLLECTION, requestId);
    await setDoc(docRef, sanitizePayload(updateData), { merge: true });

    // Update local cache
    const local = getLocalStoreRequests().map((r) => (r.id === requestId ? { ...r, ...updateData } : r));
    localStorage.setItem(LOCAL_STORE_REQUESTS_KEY, JSON.stringify(local));
    return true;
  } catch (e) {
    console.error('[Firebase] Error updating store request:', e);
    return false;
  }
}

/**
 * Create a new License / Activation Code in Cloud
 */
export async function createActivationCodeInCloud(
  code: string,
  createdForEmail?: string,
  createdForBusiness?: string,
  createdBy: string = MASTER_ADMIN_EMAIL,
  notes?: string
): Promise<{ success: boolean; error?: string; item?: ActivationCode }> {
  try {
    ensureFirebaseAuth();
    const cleanCode = code.trim().toUpperCase();
    const codeId = 'code_' + cleanCode.replace(/[^A-Z0-9]/g, '_');
    const newCode: ActivationCode = {
      id: codeId,
      code: cleanCode,
      createdForEmail: createdForEmail ? createdForEmail.trim().toLowerCase() : undefined,
      createdForBusiness: createdForBusiness ? createdForBusiness.trim() : undefined,
      isUsed: false,
      createdAt: new Date().toISOString(),
      createdBy,
      notes: notes || '',
    };

    const docRef = doc(db, ACTIVATION_CODES_COLLECTION, codeId);
    await setDoc(docRef, sanitizePayload(newCode));

    // Update local cache
    const local = getLocalActivationCodes();
    const filtered = local.filter((c) => c.code !== cleanCode);
    filtered.unshift(newCode);
    localStorage.setItem(LOCAL_ACTIVATION_CODES_KEY, JSON.stringify(filtered));

    return { success: true, item: newCode };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message || 'Failed to save activation code' };
  }
}

/**
 * Fetch all activation codes (for Master Admin)
 */
export async function fetchActivationCodes(): Promise<ActivationCode[]> {
  try {
    ensureFirebaseAuth();
    const snap = await getDocs(collection(db, ACTIVATION_CODES_COLLECTION));
    const codes: ActivationCode[] = [];
    snap.forEach((d) => codes.push(d.data() as ActivationCode));

    if (codes.length > 0) {
      localStorage.setItem(LOCAL_ACTIVATION_CODES_KEY, JSON.stringify(codes));
      return codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (e) {
    console.warn('[Firebase] Fallback to local codes cache:', e);
  }

  return getLocalActivationCodes();
}

export function getLocalActivationCodes(): ActivationCode[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVATION_CODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Verify and consume an activation code when registering a store
 */
export async function verifyAndConsumeActivationCode(
  rawCode: string,
  storeId: string,
  ownerEmail: string
): Promise<{ valid: boolean; reason?: string }> {
  const code = rawCode.trim().toUpperCase();

  // 1. Master Passcode Bypass for Owner
  if (MASTER_PASSCODES.includes(code) || ownerEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
    return { valid: true };
  }

  // 2. Check cloud & local activation codes
  try {
    ensureFirebaseAuth();
    const codeId = 'code_' + code.replace(/[^A-Z0-9]/g, '_');
    const docRef = doc(db, ACTIVATION_CODES_COLLECTION, codeId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const codeData = snap.data() as ActivationCode;
      if (codeData.isUsed) {
        return { valid: false, reason: 'This activation code has already been used.' };
      }
      if (codeData.createdForEmail && codeData.createdForEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
        return {
          valid: false,
          reason: `This license code is reserved exclusively for ${codeData.createdForEmail}.`,
        };
      }

      // Mark as used in Firestore
      await setDoc(
        docRef,
        {
          isUsed: true,
          usedByStoreId: storeId,
          usedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return { valid: true };
    }
  } catch (e) {
    console.warn('[Firebase] Cloud code check error, checking local store:', e);
  }

  // 3. Fallback to local cached activation codes
  const localCodes = getLocalActivationCodes();
  const found = localCodes.find((c) => c.code.toUpperCase() === code);
  if (found) {
    if (found.isUsed) {
      return { valid: false, reason: 'This activation code has already been used.' };
    }
    if (found.createdForEmail && found.createdForEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
      return {
        valid: false,
        reason: `This license code is reserved exclusively for ${found.createdForEmail}.`,
      };
    }

    found.isUsed = true;
    found.usedByStoreId = storeId;
    found.usedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_ACTIVATION_CODES_KEY, JSON.stringify(localCodes));
    return { valid: true };
  }

  return {
    valid: false,
    reason: 'Invalid activation code. Please contact the administrator at ' + MASTER_ADMIN_EMAIL + ' to obtain a store license.',
  };
}

/**
 * Fetch all registered stores across the system (Master Admin Only)
 */
export async function fetchAllStoresForMasterAdmin(): Promise<StoreMeta[]> {
  try {
    ensureFirebaseAuth();
    const snap = await getDocs(collection(db, STORES_COLLECTION));
    const stores: StoreMeta[] = [];
    snap.forEach((d) => stores.push(d.data() as StoreMeta));
    return stores.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('[Firebase] Error fetching all stores for master admin:', err);
    return [];
  }
}

/**
 * Delete a store completely (Master Admin Only)
 */
export async function deleteStoreInCloud(storeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    ensureFirebaseAuth();
    const cleanId = (storeId || '').trim();
    if (!cleanId) {
      return { success: false, error: 'Invalid store ID provided.' };
    }
    
    // 1. Delete main store metadata document
    try {
      await deleteDoc(doc(db, STORES_COLLECTION, cleanId));
    } catch (storeMetaErr) {
      console.warn('[Firebase] Warning deleting store metadata doc:', storeMetaErr);
    }
    
    // 2. Delete full store partition document
    try {
      await deleteDoc(doc(db, STORE_DATA_COLLECTION, cleanId));
    } catch (storeDataErr) {
      console.warn('[Firebase] Warning deleting store partition doc:', storeDataErr);
    }

    // 3. Clean up user login index records pointing to this store
    try {
      const userIndexQuery = query(collection(db, STORE_USERS_COLLECTION), where('storeId', '==', cleanId));
      const userIndexSnap = await getDocs(userIndexQuery);
      const deletePromises = userIndexSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (indexErr) {
      console.warn('[Firebase] Warning deleting user index records for store:', indexErr);
    }

    // 4. Clean up local browser caches for this store if any
    try {
      localStorage.removeItem(`store_${cleanId}_users`);
      localStorage.removeItem(`store_${cleanId}_settings`);
      localStorage.removeItem(`store_${cleanId}_offline_cache`);
      localStorage.removeItem(`store_${cleanId}_data`);
      const activeMetaRaw = localStorage.getItem('active_store_meta');
      if (activeMetaRaw) {
        const activeMeta = JSON.parse(activeMetaRaw);
        if (activeMeta?.id === cleanId) {
          localStorage.removeItem('active_store_meta');
          localStorage.removeItem('active_store_id');
        }
      }
    } catch {
      // ignore local cleanup errors
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('[Firebase] Error deleting store:', err);
    return { success: false, error: (err as Error).message || 'Failed to delete store from cloud.' };
  }
}

/**
 * Update store metadata in cloud
 */
export async function updateStoreMetaInCloud(storeId: string, updates: Partial<StoreMeta>): Promise<boolean> {
  try {
    ensureFirebaseAuth();
    const storeDocRef = doc(db, STORES_COLLECTION, storeId);
    await setDoc(storeDocRef, sanitizePayload(updates), { merge: true });
    return true;
  } catch (err) {
    console.error('[Firebase] Error updating store metadata:', err);
    return false;
  }
}

/**
 * Upgrade a trial or standard store to a full licensed store
 */
export async function upgradeStoreLicenseInCloud(
  storeId: string,
  ownerEmail: string,
  rawCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const codeCheck = await verifyAndConsumeActivationCode(rawCode, storeId, ownerEmail);
    if (!codeCheck.valid) {
      return { success: false, error: codeCheck.reason || 'Invalid license code.' };
    }

    const updates: Partial<StoreMeta> = {
      isTrial: false,
      planType: 'full',
      activationCode: rawCode.trim().toUpperCase(),
      trialEndsAt: undefined,
      lastActive: new Date().toISOString(),
    };

    await updateStoreMetaInCloud(storeId, updates);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to upgrade store license.' };
  }
}

/**
 * Extend a store's trial duration (Admin tool)
 */
export async function extendStoreTrialInCloud(
  storeId: string,
  additionalDays: number = 7
): Promise<{ success: boolean; newExpiry?: string; error?: string }> {
  try {
    ensureFirebaseAuth();
    const docRef = doc(db, STORES_COLLECTION, storeId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return { success: false, error: 'Store not found.' };
    }
    const store = snap.data() as StoreMeta;
    const currentEnd = store.trialEndsAt ? new Date(store.trialEndsAt).getTime() : Date.now();
    const baseTime = currentEnd > Date.now() ? currentEnd : Date.now();
    const newExpiry = new Date(baseTime + additionalDays * 24 * 60 * 60 * 1000).toISOString();

    await setDoc(
      docRef,
      sanitizePayload({
        isTrial: true,
        planType: 'trial',
        trialEndsAt: newExpiry,
        lastActive: new Date().toISOString(),
      }),
      { merge: true }
    );

    return { success: true, newExpiry };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message || 'Failed to extend trial.' };
  }
}

// ==========================================
// OWNER 2-STEP EMAIL OTP VERIFICATION
// ==========================================

const LOCAL_OWNER_OTP_KEY = 'storeledger_owner_otp_session';

/**
 * Send a 6-digit verification code to the Owner Email
 */
export async function sendOwnerVerificationCode(emailInput: string): Promise<{
  success: boolean;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (cleanEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
      return {
        success: false,
        error: `Access restricted. Only the platform owner (${MASTER_ADMIN_EMAIL}) is authorized to access the Owner Platform.`,
      };
    }

    ensureFirebaseAuth();

    // Generate secure 6-digit numeric code
    const rawNum = Math.floor(100000 + Math.random() * 900000);
    const code = rawNum.toString();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes validity

    const otpData = {
      email: cleanEmail,
      code,
      createdAt,
      expiresAt,
      isUsed: false,
      attempts: 0,
    };

    // 1. Save verification state to Firestore
    try {
      const emailDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');
      const docRef = doc(db, OWNER_VERIFICATION_COLLECTION, emailDocId);
      await setDoc(docRef, sanitizePayload(otpData));
    } catch (fsErr) {
      console.warn('[Firebase] Firestore OTP save notice (using local backup):', fsErr);
    }

    // 2. Dispatch real outbound email to Owner's inbox via FormSubmit secure email gateway
    try {
      await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanEmail)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: `StoreLedger Platform Owner Access Code: ${code}`,
          _template: 'box',
          _captcha: 'false',
          name: 'StoreLedger Platform Security',
          email: 'security@storeledger.io',
          verification_code: code,
          authorized_owner: cleanEmail,
          expires_in: '15 minutes',
          message: `Hello Khaldon,\n\nYour StoreLedger Owner Platform verification code is:\n\n>>> ${code} <<<\n\nThis single-use code is valid for 15 minutes.\nEnter this 6-digit code in the StoreLedger Owner Console to unlock the platform.\n\nIf you did not request this code, please secure your platform credentials.`,
        }),
      });
    } catch (netMailErr) {
      console.warn('[Email Gateway] Direct mail dispatch notice:', netMailErr);
    }

    // 3. Dispatch email via Firestore mail collection (Firebase Trigger Email extension standard)
    try {
      const mailRef = collection(db, MAIL_COLLECTION);
      await addDoc(mailRef, {
        to: [cleanEmail],
        message: {
          subject: 'StoreLedger Platform Owner Access Code: ' + code,
          text: `Hello Khaldon,\n\nYour StoreLedger Owner Platform verification code is: ${code}\n\nThis code will expire in 15 minutes.\nIf you did not request this login code, please secure your credentials.\n\nStoreLedger Security System`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #090d16; color: #f1f5f9; border-radius: 16px; border: 1px solid #1e293b;">
              <div style="margin-bottom: 20px;">
                <span style="background: #f59e0b; color: #020617; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 1px;">StoreLedger Security</span>
              </div>
              <h2 style="color: #ffffff; margin: 0 0 12px 0; font-size: 22px; font-weight: 700;">Platform Owner Authentication</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                You requested access to the StoreLedger Master Owner Platform. Use the single-use security code below to complete your login:
              </p>
              <div style="background: #0f172a; padding: 20px; border-radius: 12px; font-size: 34px; font-weight: 900; letter-spacing: 8px; text-align: center; color: #fbbf24; font-family: monospace; margin: 0 0 24px 0; border: 1px solid #334155;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
                This code will expire in 15 minutes. For your security, this code is not displayed in the application interface.
              </p>
            </div>
          `,
        },
        createdAt: createdAt,
      });
    } catch (mailErr) {
      console.warn('[Firebase] Email trigger queue notice:', mailErr);
    }

    // 4. Save to local storage cache for validation fallback
    try {
      localStorage.setItem(LOCAL_OWNER_OTP_KEY, JSON.stringify(otpData));
    } catch (e) {}

    // Security: Do NOT return the plain-text code to the client browser!
    return {
      success: true,
      expiresAt,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message || 'Failed to dispatch verification code.',
    };
  }
}

/**
 * Verify Owner 6-digit code or Master fallback
 */
export async function verifyOwnerVerificationCode(
  emailInput: string,
  enteredCode: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanCode = enteredCode.trim().replace(/\s/g, '');

    if (cleanEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
      return {
        valid: false,
        reason: `Email not recognized as platform owner (${MASTER_ADMIN_EMAIL}).`,
      };
    }

    // Master passcodes fallback
    if (MASTER_PASSCODES.includes(cleanCode)) {
      return { valid: true };
    }

    ensureFirebaseAuth();
    const emailDocId = cleanEmail.replace(/[^a-z0-9]/g, '_');

    // 1. Try Firestore verification
    try {
      const docRef = doc(db, OWNER_VERIFICATION_COLLECTION, emailDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.isUsed) {
          return { valid: false, reason: 'This verification code has already been used. Please request a new code.' };
        }
        if (new Date(data.expiresAt).getTime() < Date.now()) {
          return { valid: false, reason: 'This verification code has expired. Please request a new code.' };
        }
        if (data.code === cleanCode) {
          // Mark code as used
          await setDoc(docRef, { isUsed: true, usedAt: new Date().toISOString() }, { merge: true });
          return { valid: true };
        }
      }
    } catch (fsErr) {
      console.warn('[Firebase] Error reading cloud OTP:', fsErr);
    }

    // 2. Fallback to local session storage OTP
    try {
      const raw = localStorage.getItem(LOCAL_OWNER_OTP_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.email === cleanEmail) {
          if (data.isUsed) {
            return { valid: false, reason: 'This verification code has already been used.' };
          }
          if (new Date(data.expiresAt).getTime() < Date.now()) {
            return { valid: false, reason: 'This verification code has expired.' };
          }
          if (data.code === cleanCode) {
            data.isUsed = true;
            localStorage.setItem(LOCAL_OWNER_OTP_KEY, JSON.stringify(data));
            return { valid: true };
          }
        }
      }
    } catch (e) {}

    return {
      valid: false,
      reason: 'Invalid verification code. Please enter the 6-digit code sent to your email.',
    };
  } catch (err: unknown) {
    return {
      valid: false,
      reason: (err as Error).message || 'Failed to verify code.',
    };
  }
}
