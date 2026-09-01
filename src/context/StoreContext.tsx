import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  UserRole,
  UserActivity,
  ActivityActionType,
  InventoryItem,
  SaleRecord,
  PurchaseRecord,
  CustomerRecord,
  CustomerPayment,
  SupplierRecord,
  DailyOrder,
  OrderStatus,
  ProductBundle,
  PromoCoupon,
  WriteOffRecord,
  ReturnRecord,
  ExpenseRecord,
  StockMovement,
  InventoryAudit,
  DailyCloseRecord,
  StoreSettings,
  StoreMeta,
  StoreAccessRequest,
  ActivationCode,
} from '../types';
import {
  initIndexedDb,
  getStoredData,
  setStoredData,
  DEFAULT_USERS,
  INITIAL_INVENTORY,
  INITIAL_BUNDLES,
  INITIAL_COUPONS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_SETTINGS,
  INITIAL_ACTIVITIES,
  recoverFromIndexedDb,
  clearIndexedDbStore,
} from '../services/storage';
import {
  createStoreInCloud,
  registerStaffIndexInCloud,
  lookupUserStoreAccount,
  fetchStoreMetadata,
  fetchStoreDataPartition,
  saveStoreDataPartition,
  subscribeToStorePartition,
  listAllStoresForOwner,
  verifyAndConsumeActivationCode,
  submitStoreAccessRequest,
  fetchStoreAccessRequests,
  updateStoreRequestStatus,
  createActivationCodeInCloud,
  fetchActivationCodes,
  fetchAllStoresForMasterAdmin,
  deleteStoreInCloud,
  upgradeStoreLicenseInCloud,
  extendStoreTrialInCloud,
  sendOwnerVerificationCode,
  verifyOwnerVerificationCode,
  MASTER_ADMIN_EMAIL,
  MASTER_ADMIN_PHONE,
  MASTER_ADMIN_PHONE_INTL,
  MASTER_ADMIN_WHATSAPP,
  MASTER_PASSCODES,
  CloudSyncState,
  CloudStoreData,
} from '../services/firebase';
import { generateId, getTodayDateString, playSound } from '../utils/audio';
import { hashPassword, verifyPassword } from '../utils/security';

interface StoreContextType {
  // Multi-Tenant Store Account
  currentStore: StoreMeta | null;
  isStoreLoading: boolean;
  createStore: (params: {
    storeName: string;
    ownerName: string;
    ownerEmail: string;
    password?: string;
    pin?: string;
    currency?: string;
    description?: string;
    activationCode?: string;
    isTrial?: boolean;
  }) => Promise<{ success: boolean; error?: string; store?: StoreMeta }>;
  loginToStore: (
    identifier: string,
    password?: string,
    targetStoreId?: string
  ) => Promise<{ success: boolean; error?: string; store?: StoreMeta }>;
  switchStore: (storeId: string) => Promise<boolean>;
  logoutStore: () => void;
  listStoresForEmail: (email: string) => Promise<StoreMeta[]>;
  updateCurrentStoreMeta: (updates: Partial<StoreMeta>) => Promise<boolean>;
  upgradeStoreLicense: (code: string) => Promise<{ success: boolean; error?: string }>;
  extendStoreTrial: (storeId: string, days?: number) => Promise<{ success: boolean; newExpiry?: string; error?: string }>;
  isTrialExpired: boolean;
  trialDaysRemaining: number;

  // Store Requests & License Codes (Access Control)
  masterAdminEmail: string;
  masterAdminPhone: string;
  masterAdminPhoneIntl: string;
  masterAdminWhatsapp: string;
  isMasterAdmin: (email?: string) => boolean;
  submitAccessRequest: (req: Omit<StoreAccessRequest, 'id' | 'status' | 'requestedAt'>) => Promise<{ success: boolean; id: string; error?: string }>;
  getAccessRequests: () => Promise<StoreAccessRequest[]>;
  updateAccessRequest: (requestId: string, status: 'approved' | 'rejected', code?: string) => Promise<boolean>;
  generateActivationCode: (code: string, email?: string, business?: string, notes?: string) => Promise<{ success: boolean; item?: ActivationCode; error?: string }>;
  getActivationCodes: () => Promise<ActivationCode[]>;
  getAllMasterStores: () => Promise<StoreMeta[]>;
  deleteMasterStore: (storeId: string) => Promise<{ success: boolean; error?: string }>;
  requestOwnerOtp: (email: string) => Promise<{ success: boolean; expiresAt?: string; error?: string }>;
  verifyOwnerOtp: (email: string, code: string) => Promise<{ valid: boolean; reason?: string }>;

  // User Authentication & Profile
  currentUser: User;
  users: User[];
  login: (username: string, password?: string) => boolean | Promise<boolean>;
  loginWithPassword: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signUpWithPassword: (userData: {
    username: string;
    email: string;
    name: string;
    role: UserRole;
    password?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  registerUser: (username: string, email: string, name: string, role: UserRole, password?: string) => User;
  updateUserProfile: (
    userId: string,
    data: {
      name?: string;
      email?: string;
      username?: string;
      avatarBg?: string;
      avatarEmoji?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    userId: string,
    oldPass: string,
    newPass: string
  ) => Promise<{ success: boolean; error?: string }>;
  switchUser: (userId: string) => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
  logout: () => void;
  updateUserRole: (userId: string, role: UserRole) => void;

  // Activities / Audit Trail
  activities: UserActivity[];
  logActivity: (
    actionType: ActivityActionType,
    title: string,
    details: string,
    metadata?: Record<string, unknown>
  ) => void;
  clearActivities: () => void;

  // Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  setPin: (pin: string) => void;

  // Store Collections
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
  returns: ReturnRecord[];
  returnsLog: ReturnRecord[];
  expenses: ExpenseRecord[];
  stockMovements: StockMovement[];
  inventoryAudits: InventoryAudit[];
  dailyCloses: DailyCloseRecord[];
  dailyClosures: DailyCloseRecord[];

  // Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, item: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;

  recordSale: (sale: Omit<SaleRecord, 'id' | 'cashierId' | 'cashierName'>, editingId?: string) => void;
  deleteSale: (id: string) => void;

  recordPurchase: (purchase: Omit<PurchaseRecord, 'id' | 'recordedBy'>) => void;
  deletePurchase: (id: string) => void;

  addCustomer: (cust: Omit<CustomerRecord, 'id' | 'createdAt'>) => CustomerRecord;
  updateCustomer: (id: string, cust: Partial<CustomerRecord>) => void;
  deleteCustomer: (id: string) => void;
  recordCustomerPayment: (customerId: string, amount: number, date: string, note?: string) => void;

  addSupplier: (sup: Omit<SupplierRecord, 'id'>) => void;
  updateSupplier: (id: string, sup: Partial<SupplierRecord>) => void;
  deleteSupplier: (id: string) => void;

  addDailyOrder: (order: Omit<DailyOrder, 'id' | 'createdBy'>, editingId?: string) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteDailyOrder: (id: string) => void;

  saveBundle: (bundle: Omit<ProductBundle, 'id'>, editingId?: string) => void;
  deleteBundle: (id: string) => void;

  saveCoupon: (coupon: Omit<PromoCoupon, 'id' | 'usedCount'>, editingId?: string) => void;
  useCoupon: (code: string) => void;
  deleteCoupon: (id: string) => void;

  recordWriteOff: (writeOff: Omit<WriteOffRecord, 'id' | 'recordedBy'>) => void;
  deleteWriteOff: (id: string) => void;

  recordReturn: (ret: Omit<ReturnRecord, 'id' | 'recordedBy'>) => void;
  deleteReturn: (id: string) => void;

  recordExpense: (expense: { date: string; category: string; description: string; amount: number }) => void;
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'recordedBy'>) => void;
  deleteExpense: (id: string) => void;

  recordStocktake: (itemId: string, physicalQty: number, note?: string) => void;
  performStocktake: (updates: { itemId: string; countedQty: number }[]) => void;
  recordDailyClose: (closure: Omit<DailyCloseRecord, 'id'>) => void;
  recordDailyClosure: (closure: Omit<DailyCloseRecord, 'id'>) => void;

  // Backup & Restore
  exportAllDataAsJson: () => string;
  importAllDataFromJson: (jsonString: string) => { success: boolean; error?: string };
  exportFullBackup: () => string;
  importFullBackup: (jsonString: string) => boolean;
  syncIndexedDbNow: () => Promise<void>;
  recoverIndexedDbNow: () => Promise<boolean>;
  resetToFactorySettings: () => void;
  wipeAllData: (options?: {
    mode?: 'blank' | 'factory' | 'transactions_only';
    wipeProducts?: boolean;
    wipeCustomers?: boolean;
    wipeOrders?: boolean;
    wipeSales?: boolean;
    wipeExpenses?: boolean;
    wipeUsers?: boolean;
  }) => void;
  wipeTransactionsOnly: () => void;
  wipeAllUsersExceptAdmin: () => void;
  dispatchCloudWebhook: (triggerSource: string) => Promise<boolean>;

  // Cloud Multi-Device Sync
  cloudSyncStatus: CloudSyncState;
  lastCloudSync: string | null;
  syncWithCloudNow: () => Promise<boolean>;

  // Calculated Metrics
  tillBalance: number;
}

const StoreContext = createContext<StoreContextType | null>(null);

const EMOJI_PALETTES = ['🦊', '🦁', '🐼', '🐨', '🐯', '🦅', '🐬', '🦉', '🚀', '⭐', '💎', '🔥'];
const BG_PALETTES = [
  'bg-teal-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-cyan-600',
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Multi-Tenant Active Store State
  const [currentStore, setCurrentStore] = useState<StoreMeta | null>(() => {
    try {
      const saved = localStorage.getItem('active_store_meta');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.name) return parsed;
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isStoreLoading, setIsStoreLoading] = useState<boolean>(false);

  // Partitioned storage key generator
  const getStoreKey = useCallback(
    (key: string) => (currentStore ? `store_${currentStore.id}_${key}` : `default_${key}`),
    [currentStore]
  );

  // State Initialization
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const savedMeta = localStorage.getItem('active_store_meta');
      if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        const storedUsers = localStorage.getItem(`store_${meta.id}_users`);
        if (storedUsers) return JSON.parse(storedUsers);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('current_user_id') || '';
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const savedMeta = localStorage.getItem('active_store_meta');
      if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        const storedSettings = localStorage.getItem(`store_${meta.id}_settings`);
        if (storedSettings) return JSON.parse(storedSettings);
        return {
          ...INITIAL_SETTINGS,
          storeName: meta.name || INITIAL_SETTINGS.storeName,
          currency: meta.currency || INITIAL_SETTINGS.currency,
        };
      }
    } catch {
      // ignore
    }
    return INITIAL_SETTINGS;
  });

  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>([]);
  const [bundles, setBundles] = useState<ProductBundle[]>([]);
  const [coupons, setCoupons] = useState<PromoCoupon[]>([]);
  const [writeOffs, setWriteOffs] = useState<WriteOffRecord[]>([]);
  const [returnsLog, setReturnsLog] = useState<ReturnRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [inventoryAudits, setInventoryAudits] = useState<InventoryAudit[]>([]);
  const [dailyClosures, setDailyClosures] = useState<DailyCloseRecord[]>([]);

  // Cloud Multi-Device Sync State
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncState>('idle');
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const isRemoteUpdatingRef = useRef<boolean>(false);
  const isInitialCloudHydratedRef = useRef<boolean>(false);
  const cloudDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Current User
  const currentUser: User =
    users.find((u) => u.id === currentUserId) ||
    users[0] || {
      id: 'anon',
      username: 'guest',
      name: currentStore ? currentStore.ownerName : 'Store Guest',
      email: currentStore ? currentStore.ownerEmail : '',
      role: 'admin',
      avatarBg: 'bg-indigo-600',
      avatarEmoji: '🏪',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

  // Initialize IndexedDB
  useEffect(() => {
    initIndexedDb().catch(console.error);
  }, []);

  // Save active store session to localStorage
  useEffect(() => {
    if (currentStore) {
      localStorage.setItem('active_store_meta', JSON.stringify(currentStore));
      localStorage.setItem('active_store_id', currentStore.id);
    } else {
      localStorage.removeItem('active_store_meta');
      localStorage.removeItem('active_store_id');
      localStorage.removeItem('current_user_id');
    }
  }, [currentStore]);

  // Real-time Cloud Synchronization Listener for Active Store Partition
  useEffect(() => {
    if (!currentStore?.id) {
      setCloudSyncStatus('idle');
      return;
    }

    let isMounted = true;
    setCloudSyncStatus('syncing');

    const unsubscribe = subscribeToStorePartition(
      currentStore.id,
      (cloudData: CloudStoreData) => {
        if (!isMounted) return;

        isRemoteUpdatingRef.current = true;

        if (cloudData.users && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
          setUsers(cloudData.users);
          setCurrentUserId((prevId) => {
            const exists = cloudData.users.some((u) => u.id === prevId);
            return exists ? prevId : cloudData.users[0].id;
          });
        }
        if (cloudData.inventory && Array.isArray(cloudData.inventory)) setInventory(cloudData.inventory);
        if (cloudData.sales && Array.isArray(cloudData.sales)) setSales(cloudData.sales);
        if (cloudData.purchases && Array.isArray(cloudData.purchases)) setPurchases(cloudData.purchases);
        if (cloudData.customers && Array.isArray(cloudData.customers)) setCustomers(cloudData.customers);
        if (cloudData.customerPayments && Array.isArray(cloudData.customerPayments))
          setCustomerPayments(cloudData.customerPayments);
        if (cloudData.suppliers && Array.isArray(cloudData.suppliers)) setSuppliers(cloudData.suppliers);
        if (cloudData.dailyOrders && Array.isArray(cloudData.dailyOrders)) setDailyOrders(cloudData.dailyOrders);
        if (cloudData.bundles && Array.isArray(cloudData.bundles)) setBundles(cloudData.bundles);
        if (cloudData.coupons && Array.isArray(cloudData.coupons)) setCoupons(cloudData.coupons);
        if (cloudData.writeOffs && Array.isArray(cloudData.writeOffs)) setWriteOffs(cloudData.writeOffs);
        if (cloudData.returnsLog && Array.isArray(cloudData.returnsLog)) setReturnsLog(cloudData.returnsLog);
        if (cloudData.expenses && Array.isArray(cloudData.expenses)) setExpenses(cloudData.expenses);
        if (cloudData.stockMovements && Array.isArray(cloudData.stockMovements)) setStockMovements(cloudData.stockMovements);
        if (cloudData.inventoryAudits && Array.isArray(cloudData.inventoryAudits))
          setInventoryAudits(cloudData.inventoryAudits);
        if (cloudData.dailyClosures && Array.isArray(cloudData.dailyClosures)) setDailyClosures(cloudData.dailyClosures);
        if (cloudData.activities && Array.isArray(cloudData.activities)) setActivities(cloudData.activities);
        if (cloudData.settings && typeof cloudData.settings === 'object') setSettings(cloudData.settings);

        setCloudSyncStatus('synced');
        setLastCloudSync(cloudData.updatedAt || new Date().toISOString());
        isInitialCloudHydratedRef.current = true;

        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 400);
      },
      (err) => {
        console.warn('[StoreContext] Store partition sync status:', err);
        setCloudSyncStatus('offline');
      }
    );

    // Initial check & hydration for currentStore
    fetchStoreDataPartition(currentStore.id)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          isRemoteUpdatingRef.current = true;
          if (data.users && Array.isArray(data.users) && data.users.length > 0) {
            setUsers(data.users);
            if (!currentUserId || !data.users.some((u) => u.id === currentUserId)) {
              setCurrentUserId(data.users[0].id);
            }
          }
          if (data.inventory && Array.isArray(data.inventory)) setInventory(data.inventory);
          if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
          if (data.purchases && Array.isArray(data.purchases)) setPurchases(data.purchases);
          if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
          if (data.customerPayments && Array.isArray(data.customerPayments))
            setCustomerPayments(data.customerPayments);
          if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
          if (data.dailyOrders && Array.isArray(data.dailyOrders)) setDailyOrders(data.dailyOrders);
          if (data.bundles && Array.isArray(data.bundles)) setBundles(data.bundles);
          if (data.coupons && Array.isArray(data.coupons)) setCoupons(data.coupons);
          if (data.writeOffs && Array.isArray(data.writeOffs)) setWriteOffs(data.writeOffs);
          if (data.returnsLog && Array.isArray(data.returnsLog)) setReturnsLog(data.returnsLog);
          if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
          if (data.stockMovements && Array.isArray(data.stockMovements)) setStockMovements(data.stockMovements);
          if (data.inventoryAudits && Array.isArray(data.inventoryAudits))
            setInventoryAudits(data.inventoryAudits);
          if (data.dailyClosures && Array.isArray(data.dailyClosures)) setDailyClosures(data.dailyClosures);
          if (data.activities && Array.isArray(data.activities)) setActivities(data.activities);
          if (data.settings && typeof data.settings === 'object') setSettings(data.settings);

          setCloudSyncStatus('synced');
          setLastCloudSync(data.updatedAt || new Date().toISOString());
          isInitialCloudHydratedRef.current = true;

          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 300);
        } else {
          isInitialCloudHydratedRef.current = true;
          setCloudSyncStatus('synced');
        }
      })
      .catch((err) => {
        console.warn('[StoreContext] Error loading store partition:', err);
        setCloudSyncStatus('offline');
      });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentStore?.id]);

  // Push local state updates to Cloud Firestore across all devices for this store
  useEffect(() => {
    if (!currentStore?.id) return;
    if (isRemoteUpdatingRef.current) return;
    if (!isInitialCloudHydratedRef.current) return;

    if (cloudDebounceTimerRef.current) {
      clearTimeout(cloudDebounceTimerRef.current);
    }

    cloudDebounceTimerRef.current = setTimeout(async () => {
      setCloudSyncStatus('syncing');
      const success = await saveStoreDataPartition(
        currentStore.id,
        {
          users,
          inventory,
          sales,
          purchases,
          customers,
          customerPayments,
          suppliers,
          dailyOrders,
          bundles,
          coupons,
          writeOffs,
          returnsLog,
          expenses,
          stockMovements,
          inventoryAudits,
          dailyClosures,
          activities,
          settings,
        },
        currentUser.name
      );

      if (success) {
        setCloudSyncStatus('synced');
        setLastCloudSync(new Date().toISOString());
      } else {
        setCloudSyncStatus('offline');
      }
    }, 600);

    return () => {
      if (cloudDebounceTimerRef.current) clearTimeout(cloudDebounceTimerRef.current);
    };
  }, [
    currentStore?.id,
    users,
    inventory,
    sales,
    purchases,
    customers,
    customerPayments,
    suppliers,
    dailyOrders,
    bundles,
    coupons,
    writeOffs,
    returnsLog,
    expenses,
    stockMovements,
    inventoryAudits,
    dailyClosures,
    activities,
    settings,
    currentUser.name,
  ]);

  // Save changes to local storage partitioned by store ID
  useEffect(() => {
    if (!currentStore?.id) return;
    try {
      localStorage.setItem(`store_${currentStore.id}_users`, JSON.stringify(users));
      localStorage.setItem(`store_${currentStore.id}_settings`, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [currentStore?.id, users, settings]);

  useEffect(() => {
    if (currentUserId) localStorage.setItem('current_user_id', currentUserId);
  }, [currentUserId]);

  // Manual Sync helper
  const syncWithCloudNow = async (): Promise<boolean> => {
    if (!currentStore?.id) return false;
    setCloudSyncStatus('syncing');
    try {
      const remoteData = await fetchStoreDataPartition(currentStore.id);
      if (remoteData) {
        isRemoteUpdatingRef.current = true;
        if (remoteData.users && Array.isArray(remoteData.users) && remoteData.users.length > 0) setUsers(remoteData.users);
        if (remoteData.inventory && Array.isArray(remoteData.inventory)) setInventory(remoteData.inventory);
        if (remoteData.sales && Array.isArray(remoteData.sales)) setSales(remoteData.sales);
        if (remoteData.purchases && Array.isArray(remoteData.purchases)) setPurchases(remoteData.purchases);
        if (remoteData.customers && Array.isArray(remoteData.customers)) setCustomers(remoteData.customers);
        if (remoteData.customerPayments && Array.isArray(remoteData.customerPayments))
          setCustomerPayments(remoteData.customerPayments);
        if (remoteData.suppliers && Array.isArray(remoteData.suppliers)) setSuppliers(remoteData.suppliers);
        if (remoteData.dailyOrders && Array.isArray(remoteData.dailyOrders)) setDailyOrders(remoteData.dailyOrders);
        if (remoteData.bundles && Array.isArray(remoteData.bundles)) setBundles(remoteData.bundles);
        if (remoteData.coupons && Array.isArray(remoteData.coupons)) setCoupons(remoteData.coupons);
        if (remoteData.writeOffs && Array.isArray(remoteData.writeOffs)) setWriteOffs(remoteData.writeOffs);
        if (remoteData.returnsLog && Array.isArray(remoteData.returnsLog)) setReturnsLog(remoteData.returnsLog);
        if (remoteData.expenses && Array.isArray(remoteData.expenses)) setExpenses(remoteData.expenses);
        if (remoteData.stockMovements && Array.isArray(remoteData.stockMovements)) setStockMovements(remoteData.stockMovements);
        if (remoteData.inventoryAudits && Array.isArray(remoteData.inventoryAudits))
          setInventoryAudits(remoteData.inventoryAudits);
        if (remoteData.dailyClosures && Array.isArray(remoteData.dailyClosures)) setDailyClosures(remoteData.dailyClosures);
        if (remoteData.activities && Array.isArray(remoteData.activities)) setActivities(remoteData.activities);
        if (remoteData.settings && typeof remoteData.settings === 'object') setSettings(remoteData.settings);

        setCloudSyncStatus('synced');
        setLastCloudSync(remoteData.updatedAt || new Date().toISOString());
        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 300);
        return true;
      }

      const success = await saveStoreDataPartition(
        currentStore.id,
        {
          users,
          inventory,
          sales,
          purchases,
          customers,
          customerPayments,
          suppliers,
          dailyOrders,
          bundles,
          coupons,
          writeOffs,
          returnsLog,
          expenses,
          stockMovements,
          inventoryAudits,
          dailyClosures,
          activities,
          settings,
        },
        currentUser.name
      );

      if (success) {
        setCloudSyncStatus('synced');
        setLastCloudSync(new Date().toISOString());
      } else {
        setCloudSyncStatus('offline');
      }
      return success;
    } catch (e) {
      console.error('[StoreContext] Manual sync error:', e);
      setCloudSyncStatus('offline');
      return false;
    }
  };

  // Log Activity Helper
  const logActivity = useCallback(
    (
      actionType: ActivityActionType,
      title: string,
      details: string,
      metadata?: Record<string, unknown>
    ) => {
      const newAct: UserActivity = {
        id: generateId('act'),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        actionType,
        title,
        details,
        timestamp: new Date().toISOString(),
        metadata,
      };
      setActivities((prev) => [newAct, ...prev.slice(0, 499)]);
    },
    [currentUser]
  );

  // ================= MULTI-STORE TENANT OPERATIONS =================

  const isMasterAdmin = useCallback((email?: string): boolean => {
    const testEmail = email || currentStore?.ownerEmail || currentUser.email;
    return testEmail.trim().toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
  }, [currentStore, currentUser]);

  const submitAccessRequest = useCallback(
    async (req: Omit<StoreAccessRequest, 'id' | 'status' | 'requestedAt'>) => {
      return submitStoreAccessRequest(req);
    },
    []
  );

  const getAccessRequests = useCallback(async () => {
    return fetchStoreAccessRequests();
  }, []);

  const updateAccessRequest = useCallback(
    async (requestId: string, status: 'approved' | 'rejected', code?: string) => {
      return updateStoreRequestStatus(requestId, status, code, MASTER_ADMIN_EMAIL);
    },
    []
  );

  const generateActivationCode = useCallback(
    async (code: string, email?: string, business?: string, notes?: string) => {
      return createActivationCodeInCloud(code, email, business, MASTER_ADMIN_EMAIL, notes);
    },
    []
  );

  const getActivationCodes = useCallback(async () => {
    return fetchActivationCodes();
  }, []);

  const getAllMasterStores = useCallback(async () => {
    return fetchAllStoresForMasterAdmin();
  }, []);

  const deleteMasterStore = useCallback(async (storeId: string) => {
    return deleteStoreInCloud(storeId);
  }, []);

  const requestOwnerOtp = useCallback(async (email: string) => {
    return sendOwnerVerificationCode(email);
  }, []);

  const verifyOwnerOtp = useCallback(async (email: string, code: string) => {
    return verifyOwnerVerificationCode(email, code);
  }, []);

  const upgradeStoreLicense = useCallback(
    async (code: string) => {
      if (!currentStore) return { success: false, error: 'No active store selected.' };
      const res = await upgradeStoreLicenseInCloud(currentStore.id, currentStore.ownerEmail, code);
      if (res.success) {
        const updatedMeta: StoreMeta = {
          ...currentStore,
          isTrial: false,
          planType: 'full',
          activationCode: code.trim().toUpperCase(),
          trialEndsAt: undefined,
        };
        setCurrentStore(updatedMeta);
        try {
          localStorage.setItem('active_store_meta', JSON.stringify(updatedMeta));
        } catch {
          // ignore
        }
      }
      return res;
    },
    [currentStore]
  );

  const extendStoreTrial = useCallback(
    async (storeId: string, days: number = 7) => {
      const res = await extendStoreTrialInCloud(storeId, days);
      if (res.success && currentStore && currentStore.id === storeId && res.newExpiry) {
        const updatedMeta: StoreMeta = {
          ...currentStore,
          isTrial: true,
          planType: 'trial',
          trialEndsAt: res.newExpiry,
        };
        setCurrentStore(updatedMeta);
        try {
          localStorage.setItem('active_store_meta', JSON.stringify(updatedMeta));
        } catch {
          // ignore
        }
      }
      return res;
    },
    [currentStore]
  );

  // Compute trial status
  const isTrial = Boolean(currentStore?.isTrial);
  const trialEndsAt = currentStore?.trialEndsAt;
  const isTrialExpired = Boolean(
    isTrial && trialEndsAt && new Date(trialEndsAt).getTime() < Date.now()
  );
  const trialDaysRemaining =
    isTrial && trialEndsAt
      ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

  /**
   * Create a new Store in Cloud Firestore
   */
  const createStore = async (params: {
    storeName: string;
    ownerName: string;
    ownerEmail: string;
    password?: string;
    pin?: string;
    currency?: string;
    description?: string;
    activationCode?: string;
    isTrial?: boolean;
  }): Promise<{ success: boolean; error?: string; store?: StoreMeta }> => {
    setIsStoreLoading(true);
    try {
      const cleanEmail = params.ownerEmail.trim().toLowerCase();
      const safeStoreId = `store_${cleanEmail.replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
      const isOwnerCreating = cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase();
      const isStartingTrial = Boolean(params.isTrial && !isOwnerCreating);

      // 🛑 ACCESS CONTROL CHECK: Verify activation license code if not in Trial or Master Admin
      if (!isOwnerCreating && !isStartingTrial) {
        if (!params.activationCode || !params.activationCode.trim()) {
          return {
            success: false,
            error:
              'Store creation is protected. Please provide a valid Activation License Key, or choose the 7-Day Free Trial option.',
          };
        }

        const codeCheck = await verifyAndConsumeActivationCode(
          params.activationCode.trim(),
          safeStoreId,
          cleanEmail
        );

        if (!codeCheck.valid) {
          return {
            success: false,
            error: codeCheck.reason || 'Invalid or already used Activation License Key.',
          };
        }
      }

      let passwordHash: string | undefined = undefined;
      let passwordSalt: string | undefined = undefined;

      if (params.password && params.password.trim()) {
        const hashed = await hashPassword(params.password.trim());
        passwordHash = hashed.hash;
        passwordSalt = hashed.salt;
      }

      // Calculate 7-day trial expiration if starting free trial
      const trialExpiresAt = isStartingTrial
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const storeMeta: StoreMeta = {
        id: safeStoreId,
        name: params.storeName.trim(),
        ownerEmail: cleanEmail,
        ownerName: params.ownerName.trim(),
        currency: params.currency || '$',
        adminPin: params.pin?.trim() || '1234',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        passwordHash,
        passwordSalt,
        description: params.description?.trim(),
        activationCode: isStartingTrial
          ? 'FREE-TRIAL-7DAYS'
          : params.activationCode?.trim().toUpperCase(),
        isApproved: true,
        isTrial: isStartingTrial,
        trialEndsAt: trialExpiresAt,
        planType: isStartingTrial ? 'trial' : 'full',
      };

      const adminUser: User = {
        id: 'admin_' + generateId(),
        username: cleanEmail.split('@')[0] || 'admin',
        email: cleanEmail,
        name: params.ownerName.trim(),
        role: 'admin',
        avatarBg: 'bg-indigo-600',
        avatarEmoji: '👑',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        passwordHash,
        passwordSalt,
      };

      const newSettings: StoreSettings = {
        storeName: params.storeName.trim(),
        currency: params.currency || '$',
        adminPin: params.pin?.trim() || '1234',
        cloudWebhookUrl: '',
        autoWebhookDailyClose: 'no',
        soundEnabled: true,
      };

      const res = await createStoreInCloud(storeMeta, adminUser, {
        users: [adminUser],
        settings: newSettings,
        inventory: [],
        sales: [],
        customers: [],
        dailyOrders: [],
        expenses: [],
        activities: [],
      });

      if (!res.success) {
        return { success: false, error: res.error || 'Failed to initialize store in cloud database.' };
      }

      // Set active store and local state
      setCurrentStore(storeMeta);
      setUsers([adminUser]);
      setCurrentUserId(adminUser.id);
      setSettings(newSettings);
      setInventory([]);
      setSales([]);
      setPurchases([]);
      setCustomers([]);
      setCustomerPayments([]);
      setSuppliers([]);
      setDailyOrders([]);
      setBundles([]);
      setCoupons([]);
      setWriteOffs([]);
      setReturnsLog([]);
      setExpenses([]);
      setStockMovements([]);
      setInventoryAudits([]);
      setDailyClosures([]);
      setActivities([]);

      playSound('success', true);
      return { success: true, store: storeMeta };
    } catch (err: unknown) {
      console.error('[StoreContext] Create store error:', err);
      return { success: false, error: (err as Error).message || 'Failed to create store.' };
    } finally {
      setIsStoreLoading(false);
    }
  };

  /**
   * Log into a store by email or username
   */
  const loginToStore = async (
    identifier: string,
    password = '',
    targetStoreId?: string
  ): Promise<{ success: boolean; error?: string; store?: StoreMeta }> => {
    setIsStoreLoading(true);
    try {
      const userRecord = await lookupUserStoreAccount(identifier);

      if (!userRecord) {
        return {
          success: false,
          error: 'No store account found matching that email or username. Please check spelling or register a new store.',
        };
      }

      const storeIdToOpen = targetStoreId || userRecord.storeId;
      const storeMeta = await fetchStoreMetadata(storeIdToOpen);

      if (!storeMeta) {
        return {
          success: false,
          error: 'Store partition could not be retrieved from the cloud.',
        };
      }

      // Check Password if set on account or store
      const passHash = userRecord.passwordHash || storeMeta.passwordHash;
      const passSalt = userRecord.passwordSalt || storeMeta.passwordSalt;

      if (passHash) {
        const isValid = await verifyPassword(password, passHash, passSalt);
        // Also allow matching admin PIN
        const isPinValid = userRecord.pin && password.trim() === userRecord.pin;
        if (!isValid && !isPinValid) {
          return { success: false, error: 'Incorrect password or PIN for this store account.' };
        }
      }

      // Fetch the full store partition
      const partitionData = await fetchStoreDataPartition(storeIdToOpen);

      // Hydrate state
      setCurrentStore(storeMeta);

      if (partitionData) {
        isRemoteUpdatingRef.current = true;
        const loadedUsers = partitionData.users || [];
        setUsers(loadedUsers);

        // Find active user
        const matchingUser = loadedUsers.find(
          (u) =>
            u.email.toLowerCase() === identifier.trim().toLowerCase() ||
            u.username.toLowerCase() === identifier.trim().toLowerCase()
        );
        setCurrentUserId(matchingUser ? matchingUser.id : loadedUsers[0]?.id || 'admin');

        if (partitionData.inventory) setInventory(partitionData.inventory);
        if (partitionData.sales) setSales(partitionData.sales);
        if (partitionData.purchases) setPurchases(partitionData.purchases);
        if (partitionData.customers) setCustomers(partitionData.customers);
        if (partitionData.customerPayments) setCustomerPayments(partitionData.customerPayments);
        if (partitionData.suppliers) setSuppliers(partitionData.suppliers);
        if (partitionData.dailyOrders) setDailyOrders(partitionData.dailyOrders);
        if (partitionData.bundles) setBundles(partitionData.bundles);
        if (partitionData.coupons) setCoupons(partitionData.coupons);
        if (partitionData.writeOffs) setWriteOffs(partitionData.writeOffs);
        if (partitionData.returnsLog) setReturnsLog(partitionData.returnsLog);
        if (partitionData.expenses) setExpenses(partitionData.expenses);
        if (partitionData.stockMovements) setStockMovements(partitionData.stockMovements);
        if (partitionData.inventoryAudits) setInventoryAudits(partitionData.inventoryAudits);
        if (partitionData.dailyClosures) setDailyClosures(partitionData.dailyClosures);
        if (partitionData.activities) setActivities(partitionData.activities);
        if (partitionData.settings) setSettings(partitionData.settings);

        setTimeout(() => {
          isRemoteUpdatingRef.current = false;
        }, 300);
      }

      playSound('success', true);
      return { success: true, store: storeMeta };
    } catch (err: unknown) {
      console.error('[StoreContext] Login to store error:', err);
      return { success: false, error: (err as Error).message || 'Failed to authenticate into store.' };
    } finally {
      setIsStoreLoading(false);
    }
  };

  /**
   * Switch between branches / stores
   */
  const switchStore = async (storeId: string): Promise<boolean> => {
    setIsStoreLoading(true);
    try {
      const meta = await fetchStoreMetadata(storeId);
      if (!meta) return false;

      setCurrentStore(meta);
      return true;
    } catch (e) {
      console.error('[StoreContext] Switch store error:', e);
      return false;
    } finally {
      setIsStoreLoading(false);
    }
  };

  /**
   * Log out of current store and return to multi-store portal
   */
  const logoutStore = () => {
    setCurrentStore(null);
    setUsers([]);
    setCurrentUserId('');
    setInventory([]);
    setSales([]);
    setPurchases([]);
    setCustomers([]);
    setCustomerPayments([]);
    setSuppliers([]);
    setDailyOrders([]);
    setBundles([]);
    setCoupons([]);
    setWriteOffs([]);
    setReturnsLog([]);
    setExpenses([]);
    setStockMovements([]);
    setInventoryAudits([]);
    setDailyClosures([]);
    setActivities([]);
    setCloudSyncStatus('idle');

    localStorage.removeItem('active_store_meta');
    localStorage.removeItem('active_store_id');
    localStorage.removeItem('current_user_id');
    playSound('delete', settings.soundEnabled);
  };

  /**
   * List all stores belonging to an email
   */
  const listStoresForEmail = async (email: string): Promise<StoreMeta[]> => {
    return listAllStoresForOwner(email);
  };

  /**
   * Update Store Metadata
   */
  const updateCurrentStoreMeta = async (updates: Partial<StoreMeta>): Promise<boolean> => {
    if (!currentStore) return false;
    const updated = { ...currentStore, ...updates, lastActive: new Date().toISOString() };
    setCurrentStore(updated);
    if (updates.name) {
      setSettings((prev) => ({ ...prev, storeName: updates.name! }));
    }
    if (updates.currency) {
      setSettings((prev) => ({ ...prev, currency: updates.currency! }));
    }
    return true;
  };

  // ================= SUB-USER AUTH & PROFILE =================

  const login = (username: string): boolean => {
    const clean = username.trim().toLowerCase();
    const found = users.find((u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);
    if (found) {
      setCurrentUserId(found.id);
      found.lastLogin = new Date().toISOString();
      setUsers((prev) => prev.map((u) => (u.id === found.id ? { ...u, lastLogin: found.lastLogin } : u)));
      logActivity('login', 'User Logged In', `${found.name} (${found.role}) signed into POS console.`);
      playSound('success', settings.soundEnabled);
      return true;
    }
    return false;
  };

  const loginWithPassword = async (
    identifier: string,
    password = ''
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const clean = identifier.trim().toLowerCase();
    const found = users.find(
      (u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
    );

    if (!found) {
      playSound('delete', settings.soundEnabled);
      return { success: false, error: 'No user account found with that email or username in this store.' };
    }

    if (found.passwordHash) {
      const isValid = await verifyPassword(password, found.passwordHash, found.passwordSalt);
      if (!isValid) {
        playSound('delete', settings.soundEnabled);
        return { success: false, error: 'Invalid password.' };
      }
    }

    setCurrentUserId(found.id);
    const updatedLoginTime = new Date().toISOString();
    setUsers((prev) =>
      prev.map((u) => (u.id === found.id ? { ...u, lastLogin: updatedLoginTime } : u))
    );

    const loggedInUser = { ...found, lastLogin: updatedLoginTime };
    logActivity('login', 'User Authenticated', `${found.name} (${found.role}) logged in.`);
    playSound('success', settings.soundEnabled);
    return { success: true, user: loggedInUser };
  };

  const signUpWithPassword = async (userData: {
    username: string;
    email: string;
    name: string;
    role: UserRole;
    password?: string;
  }): Promise<{ success: boolean; error?: string; user?: User }> => {
    const cleanUsername = userData.username.trim().toLowerCase();
    const cleanEmail = userData.email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail || !userData.name.trim()) {
      return { success: false, error: 'Please fill in all required fields.' };
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: 'Username is already taken in this store.' };
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email address is already registered in this store.' };
    }

    let passwordHash: string | undefined = undefined;
    let passwordSalt: string | undefined = undefined;

    if (userData.password && userData.password.trim()) {
      const hashed = await hashPassword(userData.password.trim());
      passwordHash = hashed.hash;
      passwordSalt = hashed.salt;
    }

    const randBg = BG_PALETTES[Math.floor(Math.random() * BG_PALETTES.length)];
    const randEmoji = EMOJI_PALETTES[Math.floor(Math.random() * EMOJI_PALETTES.length)];
    const newUser: User = {
      id: generateId('user'),
      username: cleanUsername,
      email: cleanEmail,
      name: userData.name.trim(),
      role: userData.role,
      avatarBg: randBg,
      avatarEmoji: randEmoji,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      passwordHash,
      passwordSalt,
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);

    // Register index in cloud so this staff member can log in from any device
    if (currentStore) {
      registerStaffIndexInCloud(newUser, currentStore).catch(console.warn);
    }

    logActivity(
      'register',
      'Staff Account Registered',
      `Registered user profile for ${newUser.name} (@${newUser.username}) with ${newUser.role} role.`
    );
    playSound('success', settings.soundEnabled);
    return { success: true, user: newUser };
  };

  const registerUser = (
    username: string,
    email: string,
    name: string,
    role: UserRole,
    password?: string
  ): User => {
    const randBg = BG_PALETTES[Math.floor(Math.random() * BG_PALETTES.length)];
    const randEmoji = EMOJI_PALETTES[Math.floor(Math.random() * EMOJI_PALETTES.length)];
    const newUser: User = {
      id: generateId('user'),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role,
      avatarBg: randBg,
      avatarEmoji: randEmoji,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    if (currentStore) {
      registerStaffIndexInCloud(newUser, currentStore).catch(console.warn);
    }
    logActivity('register', 'New User Registered', `Created user account for ${newUser.name} with role ${newUser.role}.`);
    playSound('success', settings.soundEnabled);
    return newUser;
  };

  const updateUserProfile = async (
    userId: string,
    data: {
      name?: string;
      email?: string;
      username?: string;
      avatarBg?: string;
      avatarEmoji?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'User account not found.' };
    }

    if (data.username && data.username.trim().toLowerCase() !== target.username.toLowerCase()) {
      const exists = users.some(
        (u) => u.id !== userId && u.username.toLowerCase() === data.username!.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: 'Username is already taken by another account.' };
      }
    }

    if (data.email && data.email.trim().toLowerCase() !== target.email.toLowerCase()) {
      const exists = users.some(
        (u) => u.id !== userId && u.email.toLowerCase() === data.email!.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: 'Email address is already in use.' };
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          name: data.name?.trim() ?? u.name,
          email: data.email?.trim().toLowerCase() ?? u.email,
          username: data.username?.trim().toLowerCase() ?? u.username,
          avatarBg: data.avatarBg ?? u.avatarBg,
          avatarEmoji: data.avatarEmoji ?? u.avatarEmoji,
        };
      })
    );

    logActivity('profile_update', 'Profile Updated', `Updated profile settings for ${data.name || target.name}.`);
    playSound('success', settings.soundEnabled);
    return { success: true };
  };

  const changePassword = async (
    userId: string,
    oldPass: string,
    newPass: string
  ): Promise<{ success: boolean; error?: string }> => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'User account not found.' };
    }

    if (target.passwordHash) {
      const isValid = await verifyPassword(oldPass, target.passwordHash, target.passwordSalt);
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect.' };
      }
    }

    if (newPass.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters.' };
    }

    const { hash, salt } = await hashPassword(newPass);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, passwordHash: hash, passwordSalt: salt } : u))
    );

    logActivity('password_change', 'Password Changed', `Security password updated for account ${target.name}.`);
    playSound('success', settings.soundEnabled);
    return { success: true };
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      logActivity('user_switch', 'User Switched', `Switched active operator to ${target.name} (${target.role}).`);
      playSound('success', settings.soundEnabled);
    }
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User not found' };
    if (target.role === 'admin') {
      const adminCount = users.filter((u) => u.role === 'admin').length;
      if (adminCount <= 1) {
        return { success: false, error: 'Cannot delete the primary Store Administrator.' };
      }
    }

    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    if (currentUserId === userId) {
      setCurrentUserId(updated[0]?.id || '');
    }
    logActivity('user_delete', 'User Removed', `Deleted user account ${target.name} (${target.role}).`);
    playSound('delete', settings.soundEnabled);
    return { success: true };
  };

  const logout = () => {
    // Switch to first available user or keep current session
    if (users.length > 1) {
      const nextUser = users.find((u) => u.id !== currentUserId) || users[0];
      setCurrentUserId(nextUser.id);
      logActivity('logout', 'User Switched Session', `Switched active cashier session.`);
    } else {
      logoutStore();
    }
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    logActivity('profile_update', 'Role Updated', `Changed role of user to ${role}.`);
  };

  // ================= STORE COLLECTIONS & BUSINESS LOGIC =================

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logActivity('profile_update', 'Settings Updated', `Updated store configuration.`);
      return updated;
    });
  };

  const setPin = (pin: string) => {
    updateSettings({ adminPin: pin });
  };

  const clearActivities = () => {
    setActivities([]);
    playSound('delete', settings.soundEnabled);
  };

  // Inventory CRUD
  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      id: generateId('item'),
      ...item,
    };
    setInventory((prev) => [newItem, ...prev]);

    // Record initial stock movement
    const movement: StockMovement = {
      id: generateId('mov'),
      date: getTodayDateString(),
      type: 'IN',
      itemId: newItem.id,
      itemName: newItem.name,
      qty: newItem.qty,
      qtyChange: newItem.qty,
      previousQty: 0,
      newQty: newItem.qty,
      reference: 'Initial Stock Creation',
      userId: currentUser.id,
      userName: currentUser.name,
    };
    setStockMovements((prev) => [movement, ...prev]);
    logActivity('inventory_add', 'Product Added', `Added ${newItem.name} (${newItem.qty} in stock).`);
    playSound('success', settings.soundEnabled);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          if (updates.qty !== undefined && updates.qty !== item.qty) {
            const diff = updates.qty - item.qty;
            const movement: StockMovement = {
              id: generateId('mov'),
              date: getTodayDateString(),
              type: diff > 0 ? 'IN' : 'OUT',
              itemId: item.id,
              itemName: item.name,
              qty: Math.abs(diff),
              qtyChange: diff,
              previousQty: item.qty,
              newQty: updates.qty,
              reference: 'Manual Adjustment',
              userId: currentUser.id,
              userName: currentUser.name,
            };
            setStockMovements((m) => [movement, ...m]);
          }
          return updated;
        }
        return item;
      })
    );
    logActivity('inventory_edit', 'Product Updated', `Updated product details.`);
  };

  const deleteInventoryItem = (id: string) => {
    const target = inventory.find((i) => i.id === id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
    if (target) {
      logActivity('inventory_delete', 'Product Deleted', `Removed ${target.name} from catalog.`);
    }
    playSound('delete', settings.soundEnabled);
  };

  // Sales / POS
  const recordSale = (sale: Omit<SaleRecord, 'id' | 'cashierId' | 'cashierName'>, editingId?: string) => {
    if (editingId) {
      setSales((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, ...sale, cashierId: currentUser.id, cashierName: currentUser.name }
            : s
        )
      );
      logActivity('sale_edit', 'Sale Modified', `Updated invoice #${editingId}.`);
      return;
    }

    const newSale: SaleRecord = {
      id: generateId('sale'),
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      ...sale,
    };

    setSales((prev) => [newSale, ...prev]);

    // Decrement stock for sold items
    newSale.items.forEach((saleItem) => {
      setInventory((prev) =>
        prev.map((inv) => {
          if (inv.id === saleItem.itemId || inv.name === saleItem.itemName) {
            const nextQty = Math.max(0, inv.qty - saleItem.qty);
            const movement: StockMovement = {
              id: generateId('mov'),
              date: newSale.date,
              type: 'OUT',
              itemId: inv.id,
              itemName: inv.name,
              qty: saleItem.qty,
              qtyChange: -saleItem.qty,
              previousQty: inv.qty,
              newQty: nextQty,
              reference: `POS Sale ${newSale.id}`,
              userId: currentUser.id,
              userName: currentUser.name,
            };
            setStockMovements((m) => [movement, ...m]);
            return { ...inv, qty: nextQty };
          }
          return inv;
        })
      );
    });

    // Update customer debt if credit sale
    if (newSale.customer && (newSale.paymentMethod === 'debt' || newSale.paymentMethod === 'credit')) {
      const debtAmount = newSale.debt || newSale.total;
      setCustomers((prev) =>
        prev.map((c) =>
          c.name === newSale.customer || c.id === newSale.customer
            ? { ...c, totalDebt: (c.totalDebt || 0) + debtAmount }
            : c
        )
      );
    }

    logActivity('sale', 'Sale Completed', `Processed sale of ${settings.currency}${newSale.total.toFixed(2)} (${newSale.paymentMethod}).`);
    playSound('cash', settings.soundEnabled);
  };

  const deleteSale = (id: string) => {
    const targetSale = sales.find((s) => s.id === id);
    if (targetSale) {
      // 1. Restore stock of all sold items & log stock movements
      if (targetSale.items && targetSale.items.length > 0) {
        targetSale.items.forEach((saleItem) => {
          if (saleItem.itemId) {
            setInventory((prev) =>
              prev.map((inv) => {
                if (inv.id === saleItem.itemId || inv.name.toLowerCase() === saleItem.itemName.toLowerCase()) {
                  const nextQty = inv.qty + saleItem.qty;
                  const movement: StockMovement = {
                    id: generateId('mov'),
                    date: getTodayDateString(),
                    type: 'IN',
                    itemId: inv.id,
                    itemName: inv.name,
                    qty: saleItem.qty,
                    qtyChange: saleItem.qty,
                    previousQty: inv.qty,
                    newQty: nextQty,
                    reference: `Voided Sale #${targetSale.id}`,
                    userId: currentUser.id,
                    userName: currentUser.name,
                  };
                  setStockMovements((m) => [movement, ...m]);
                  return { ...inv, qty: nextQty };
                }
                return inv;
              })
            );
          }
        });
      }

      // 2. If the sale had debt, reduce customer's debt
      if (targetSale.customer && (targetSale.debt || targetSale.paymentMethod === 'debt' || targetSale.paymentMethod === 'credit')) {
        const debtAmt = targetSale.debt || targetSale.total;
        if (debtAmt > 0) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.name === targetSale.customer || c.id === targetSale.customer
                ? { ...c, totalDebt: Math.max(0, (c.totalDebt || 0) - debtAmt) }
                : c
            )
          );
        }
      }
    }

    setSales((prev) => prev.filter((s) => s.id !== id));
    logActivity('sale_delete', 'Sale Voided', `Voided sale ticket #${id}.`);
    playSound('delete', settings.soundEnabled);
  };

  // Purchases
  const recordPurchase = (purchase: Omit<PurchaseRecord, 'id' | 'recordedBy'>) => {
    const newPurchase: PurchaseRecord = {
      id: generateId('po'),
      recordedBy: currentUser.name,
      ...purchase,
    };
    setPurchases((prev) => [newPurchase, ...prev]);

    // Increase stock
    if (purchase.itemId) {
      setInventory((prev) =>
        prev.map((inv) => {
          if (inv.id === purchase.itemId) {
            const nextQty = inv.qty + purchase.qty;
            const mov: StockMovement = {
              id: generateId('mov'),
              date: purchase.date,
              type: 'IN',
              itemId: inv.id,
              itemName: inv.name,
              qty: purchase.qty,
              qtyChange: purchase.qty,
              previousQty: inv.qty,
              newQty: nextQty,
              reference: `Purchase from ${purchase.supplier || 'Supplier'}`,
              userId: currentUser.id,
              userName: currentUser.name,
            };
            setStockMovements((m) => [mov, ...m]);
            return { ...inv, qty: nextQty, cost: purchase.cost || inv.cost };
          }
          return inv;
        })
      );
    }

    logActivity('purchase', 'Restock Recorded', `Purchased ${purchase.qty} of ${purchase.itemName} from ${purchase.supplier || 'Supplier'}.`);
    playSound('success', settings.soundEnabled);
  };

  const deletePurchase = (id: string) => {
    setPurchases((prev) => prev.filter((p) => p.id !== id));
    logActivity('purchase_delete', 'Purchase Order Cancelled', `Deleted purchase order.`);
    playSound('delete', settings.soundEnabled);
  };

  // Customers CRM
  const addCustomer = (cust: Omit<CustomerRecord, 'id' | 'createdAt'>): CustomerRecord => {
    const newCust: CustomerRecord = {
      id: generateId('cust'),
      createdAt: getTodayDateString(),
      ...cust,
      totalDebt: cust.totalDebt || 0,
      creditLimit: cust.creditLimit || 500,
    };
    setCustomers((prev) => [newCust, ...prev]);
    logActivity('profile_update', 'Customer Registered', `Created CRM record for ${newCust.name}.`);
    playSound('success', settings.soundEnabled);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<CustomerRecord>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    playSound('delete', settings.soundEnabled);
  };

  const recordCustomerPayment = (customerId: string, amount: number, date: string, note?: string) => {
    const payment: CustomerPayment = {
      id: generateId('pay'),
      customerId,
      amount,
      date,
      note,
      recordedBy: currentUser.name,
    };
    setCustomerPayments((prev) => [payment, ...prev]);
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const nextDebt = Math.max(0, (c.totalDebt || 0) - amount);
          return { ...c, totalDebt: nextDebt };
        }
        return c;
      })
    );
    logActivity('sale', 'Debt Payment Received', `Received ${settings.currency}${amount.toFixed(2)} debt payment from customer.`);
    playSound('cash', settings.soundEnabled);
  };

  // Suppliers
  const addSupplier = (sup: Omit<SupplierRecord, 'id'>) => {
    const newSup: SupplierRecord = {
      id: generateId('sup'),
      ...sup,
    };
    setSuppliers((prev) => [newSup, ...prev]);
    playSound('success', settings.soundEnabled);
  };

  const updateSupplier = (id: string, updates: Partial<SupplierRecord>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    playSound('delete', settings.soundEnabled);
  };

  // Daily Orders Board
  const addDailyOrder = (order: Omit<DailyOrder, 'id' | 'createdBy'>, editingId?: string) => {
    if (editingId) {
      setDailyOrders((prev) => prev.map((o) => (o.id === editingId ? { ...o, ...order } : o)));
      return;
    }
    const newOrder: DailyOrder = {
      id: generateId('ord'),
      createdBy: currentUser.name,
      ...order,
    };
    setDailyOrders((prev) => [newOrder, ...prev]);
    playSound('success', settings.soundEnabled);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setDailyOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const deleteDailyOrder = (id: string) => {
    setDailyOrders((prev) => prev.filter((o) => o.id !== id));
    playSound('delete', settings.soundEnabled);
  };

  // Bundles & Coupons
  const saveBundle = (bundle: Omit<ProductBundle, 'id'>, editingId?: string) => {
    if (editingId) {
      setBundles((prev) => prev.map((b) => (b.id === editingId ? { ...b, ...bundle } : b)));
      return;
    }
    const newBundle: ProductBundle = { id: generateId('bdl'), ...bundle };
    setBundles((prev) => [newBundle, ...prev]);
    playSound('success', settings.soundEnabled);
  };

  const deleteBundle = (id: string) => {
    setBundles((prev) => prev.filter((b) => b.id !== id));
    playSound('delete', settings.soundEnabled);
  };

  const saveCoupon = (coupon: Omit<PromoCoupon, 'id' | 'usedCount'>, editingId?: string) => {
    if (editingId) {
      setCoupons((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...coupon } : c)));
      return;
    }
    const newCoupon: PromoCoupon = { id: generateId('cpn'), usedCount: 0, ...coupon };
    setCoupons((prev) => [newCoupon, ...prev]);
    playSound('success', settings.soundEnabled);
  };

  const useCoupon = (code: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.code.toUpperCase() === code.toUpperCase() ? { ...c, usedCount: (c.usedCount || 0) + 1 } : c))
    );
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    playSound('delete', settings.soundEnabled);
  };

  // Write-Offs & Returns
  const recordWriteOff = (writeOff: Omit<WriteOffRecord, 'id' | 'recordedBy'>) => {
    const newRecord: WriteOffRecord = {
      id: generateId('wo'),
      recordedBy: currentUser.name,
      ...writeOff,
    };
    setWriteOffs((prev) => [newRecord, ...prev]);

    // Adjust inventory
    if (writeOff.itemId) {
      setInventory((prev) =>
        prev.map((inv) => {
          if (inv.id === writeOff.itemId) {
            const nextQty = Math.max(0, inv.qty - writeOff.qty);
            const mov: StockMovement = {
              id: generateId('mov'),
              date: writeOff.date,
              type: 'OUT',
              itemId: inv.id,
              itemName: inv.name,
              qty: writeOff.qty,
              qtyChange: -writeOff.qty,
              previousQty: inv.qty,
              newQty: nextQty,
              reference: `Write-off: ${writeOff.note || writeOff.type}`,
              userId: currentUser.id,
              userName: currentUser.name,
            };
            setStockMovements((m) => [mov, ...m]);
            return { ...inv, qty: nextQty };
          }
          return inv;
        })
      );
    }
    playSound('delete', settings.soundEnabled);
  };

  const deleteWriteOff = (id: string) => {
    setWriteOffs((prev) => prev.filter((w) => w.id !== id));
  };

  const recordReturn = (ret: Omit<ReturnRecord, 'id' | 'recordedBy'>) => {
    const newRecord: ReturnRecord = {
      id: generateId('ret'),
      recordedBy: currentUser.name,
      ...ret,
    };
    setReturnsLog((prev) => [newRecord, ...prev]);

    // Restock item if customer return
    if (ret.itemId && ret.returnType !== 'Supplier') {
      setInventory((prev) =>
        prev.map((inv) => {
          if (inv.id === ret.itemId) {
            const nextQty = inv.qty + ret.qty;
            const mov: StockMovement = {
              id: generateId('mov'),
              date: ret.date,
              type: 'IN',
              itemId: inv.id,
              itemName: inv.name,
              qty: ret.qty,
              qtyChange: ret.qty,
              previousQty: inv.qty,
              newQty: nextQty,
              reference: `Customer Return: ${ret.reason || 'Restocked'}`,
              userId: currentUser.id,
              userName: currentUser.name,
            };
            setStockMovements((m) => [mov, ...m]);
            return { ...inv, qty: nextQty };
          }
          return inv;
        })
      );
    }
    playSound('success', settings.soundEnabled);
  };

  const deleteReturn = (id: string) => {
    setReturnsLog((prev) => prev.filter((r) => r.id !== id));
  };

  // Expenses
  const recordExpense = (exp: { date: string; category: string; description: string; amount: number }) => {
    const newExp: ExpenseRecord = {
      id: generateId('exp'),
      recordedBy: currentUser.name,
      ...exp,
    };
    setExpenses((prev) => [newExp, ...prev]);
    logActivity('profile_update', 'Expense Logged', `Logged expense of ${settings.currency}${exp.amount.toFixed(2)} for ${exp.category}.`);
    playSound('delete', settings.soundEnabled);
  };

  const addExpense = (exp: Omit<ExpenseRecord, 'id' | 'recordedBy'>) => {
    recordExpense(exp);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // Stocktake & Audits
  const recordStocktake = (itemId: string, physicalQty: number, note?: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    const diff = physicalQty - item.qty;
    const audit: InventoryAudit = {
      id: generateId('aud'),
      date: getTodayDateString(),
      itemId,
      itemName: item.name,
      systemQty: item.qty,
      physicalQty,
      diff,
      note,
      auditedBy: currentUser.name,
    };
    setInventoryAudits((prev) => [audit, ...prev]);

    // Update physical count in inventory
    setInventory((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, qty: physicalQty } : i))
    );

    const mov: StockMovement = {
      id: generateId('mov'),
      date: getTodayDateString(),
      type: diff >= 0 ? 'IN' : 'OUT',
      itemId: item.id,
      itemName: item.name,
      qty: Math.abs(diff),
      qtyChange: diff,
      previousQty: item.qty,
      newQty: physicalQty,
      reference: `Stocktake Audit (${diff >= 0 ? '+' : ''}${diff})`,
      userId: currentUser.id,
      userName: currentUser.name,
    };
    setStockMovements((m) => [mov, ...m]);
    playSound('success', settings.soundEnabled);
  };

  const performStocktake = (updates: { itemId: string; countedQty: number }[]) => {
    updates.forEach((u) => recordStocktake(u.itemId, u.countedQty));
  };

  // Daily Registers & Shift Closures
  const recordDailyClose = (closure: Omit<DailyCloseRecord, 'id'>) => {
    const newClose: DailyCloseRecord = {
      id: generateId('dc'),
      ...closure,
    };
    setDailyClosures((prev) => [newClose, ...prev]);
    logActivity('sale', 'Daily Register Closed', `Closed register with cash variance of ${settings.currency}${closure.variance.toFixed(2)}.`);
    playSound('success', settings.soundEnabled);
  };

  const recordDailyClosure = (closure: Omit<DailyCloseRecord, 'id'>) => {
    recordDailyClose(closure);
  };

  // Till Balance Calculation
  const totalCashSales = sales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);
  const totalCashPayments = customerPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCashExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const tillBalance = totalCashSales + totalCashPayments - totalCashExpenses;

  // Webhook Dispatch
  const dispatchCloudWebhook = async (triggerSource: string): Promise<boolean> => {
    if (!settings.cloudWebhookUrl || !settings.cloudWebhookUrl.trim()) return false;
    try {
      const payload = {
        trigger: triggerSource,
        store: currentStore?.name,
        timestamp: new Date().toISOString(),
        tillBalance,
        operator: currentUser.name,
      };
      await fetch(settings.cloudWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      });
      return true;
    } catch {
      return false;
    }
  };

  // Backup & Restore
  const exportAllDataAsJson = (): string => {
    const dump = {
      store: currentStore,
      users,
      inventory,
      sales,
      purchases,
      customers,
      customerPayments,
      suppliers,
      dailyOrders,
      bundles,
      coupons,
      writeOffs,
      returnsLog,
      expenses,
      stockMovements,
      inventoryAudits,
      dailyClosures,
      activities,
      settings,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(dump, null, 2);
  };

  const importAllDataFromJson = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (data.users && Array.isArray(data.users)) setUsers(data.users);
      if (data.inventory && Array.isArray(data.inventory)) setInventory(data.inventory);
      if (data.sales && Array.isArray(data.sales)) setSales(data.sales);
      if (data.purchases && Array.isArray(data.purchases)) setPurchases(data.purchases);
      if (data.customers && Array.isArray(data.customers)) setCustomers(data.customers);
      if (data.customerPayments && Array.isArray(data.customerPayments)) setCustomerPayments(data.customerPayments);
      if (data.suppliers && Array.isArray(data.suppliers)) setSuppliers(data.suppliers);
      if (data.dailyOrders && Array.isArray(data.dailyOrders)) setDailyOrders(data.dailyOrders);
      if (data.bundles && Array.isArray(data.bundles)) setBundles(data.bundles);
      if (data.coupons && Array.isArray(data.coupons)) setCoupons(data.coupons);
      if (data.writeOffs && Array.isArray(data.writeOffs)) setWriteOffs(data.writeOffs);
      if (data.returnsLog && Array.isArray(data.returnsLog)) setReturnsLog(data.returnsLog);
      if (data.expenses && Array.isArray(data.expenses)) setExpenses(data.expenses);
      if (data.stockMovements && Array.isArray(data.stockMovements)) setStockMovements(data.stockMovements);
      if (data.inventoryAudits && Array.isArray(data.inventoryAudits)) setInventoryAudits(data.inventoryAudits);
      if (data.dailyClosures && Array.isArray(data.dailyClosures)) setDailyClosures(data.dailyClosures);
      if (data.activities && Array.isArray(data.activities)) setActivities(data.activities);
      if (data.settings && typeof data.settings === 'object') setSettings(data.settings);

      playSound('success', true);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: (e as Error).message || 'Invalid backup format' };
    }
  };

  const exportFullBackup = (): string => exportAllDataAsJson();
  const importFullBackup = (jsonString: string): boolean => importAllDataFromJson(jsonString).success;

  const syncIndexedDbNow = async (): Promise<void> => {
    // Mirror to indexedDB
  };

  const recoverIndexedDbNow = async (): Promise<boolean> => {
    const recovered = await recoverFromIndexedDb();
    return !!recovered;
  };

  const resetToFactorySettings = () => {
    setInventory([]);
    setSales([]);
    setPurchases([]);
    setCustomers([]);
    setCustomerPayments([]);
    setSuppliers([]);
    setDailyOrders([]);
    setBundles([]);
    setCoupons([]);
    setWriteOffs([]);
    setReturnsLog([]);
    setExpenses([]);
    setStockMovements([]);
    setInventoryAudits([]);
    setDailyClosures([]);
    setActivities([]);
    playSound('delete', true);
  };

  const wipeAllData = (options?: {
    mode?: 'blank' | 'factory' | 'transactions_only';
    wipeProducts?: boolean;
    wipeCustomers?: boolean;
    wipeOrders?: boolean;
    wipeSales?: boolean;
    wipeExpenses?: boolean;
    wipeUsers?: boolean;
  }) => {
    if (options?.wipeSales !== false) setSales([]);
    if (options?.wipeOrders !== false) setDailyOrders([]);
    if (options?.wipeExpenses !== false) setExpenses([]);
    if (options?.wipeProducts) setInventory([]);
    if (options?.wipeCustomers) {
      setCustomers([]);
      setCustomerPayments([]);
    }
    playSound('delete', true);
  };

  const wipeTransactionsOnly = () => {
    setSales([]);
    setCustomerPayments([]);
    setExpenses([]);
    setDailyClosures([]);
    setStockMovements([]);
    playSound('delete', true);
  };

  const wipeAllUsersExceptAdmin = () => {
    setUsers((prev) => prev.filter((u) => u.role === 'admin'));
    playSound('delete', true);
  };

  const value: StoreContextType = {
    currentStore,
    isStoreLoading,
    createStore,
    loginToStore,
    switchStore,
    logoutStore,
    listStoresForEmail,
    updateCurrentStoreMeta,
    upgradeStoreLicense,
    extendStoreTrial,
    isTrialExpired,
    trialDaysRemaining,

    // Store Requests & License Codes (Access Control)
    masterAdminEmail: MASTER_ADMIN_EMAIL,
    masterAdminPhone: MASTER_ADMIN_PHONE,
    masterAdminPhoneIntl: MASTER_ADMIN_PHONE_INTL,
    masterAdminWhatsapp: MASTER_ADMIN_WHATSAPP,
    isMasterAdmin,
    submitAccessRequest,
    getAccessRequests,
    updateAccessRequest,
    generateActivationCode,
    getActivationCodes,
    getAllMasterStores,
    deleteMasterStore,
    requestOwnerOtp,
    verifyOwnerOtp,

    currentUser,
    users,
    login,
    loginWithPassword,
    signUpWithPassword,
    registerUser,
    updateUserProfile,
    changePassword,
    switchUser,
    deleteUser,
    logout,
    updateUserRole,

    activities,
    logActivity,
    clearActivities,

    settings,
    updateSettings,
    setPin,

    inventory,
    sales,
    purchases,
    customers,
    customerPayments,
    suppliers,
    dailyOrders,
    bundles,
    coupons,
    writeOffs,
    returns: returnsLog,
    returnsLog,
    expenses,
    stockMovements,
    inventoryAudits,
    dailyCloses: dailyClosures,
    dailyClosures,

    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,

    recordSale,
    deleteSale,

    recordPurchase,
    deletePurchase,

    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,

    addSupplier,
    updateSupplier,
    deleteSupplier,

    addDailyOrder,
    updateOrderStatus,
    deleteDailyOrder,

    saveBundle,
    deleteBundle,

    saveCoupon,
    useCoupon,
    deleteCoupon,

    recordWriteOff,
    deleteWriteOff,

    recordReturn,
    deleteReturn,

    recordExpense,
    addExpense,
    deleteExpense,

    recordStocktake,
    performStocktake,
    recordDailyClose,
    recordDailyClosure,

    exportAllDataAsJson,
    importAllDataFromJson,
    exportFullBackup,
    importFullBackup,
    syncIndexedDbNow,
    recoverIndexedDbNow,
    resetToFactorySettings,
    wipeAllData,
    wipeTransactionsOnly,
    wipeAllUsersExceptAdmin,
    dispatchCloudWebhook,

    cloudSyncStatus,
    lastCloudSync,
    syncWithCloudNow,

    tillBalance,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
