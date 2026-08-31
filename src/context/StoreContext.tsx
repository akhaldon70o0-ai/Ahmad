import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { generateId, getTodayDateString, playSound } from '../utils/audio';
import { hashPassword, verifyPassword } from '../utils/security';

interface StoreContextType {
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
  // State Initialization from LocalStorage
  const [users, setUsers] = useState<User[]>(() => getStoredData('users', DEFAULT_USERS));
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem('current_user_id');
    return saved || DEFAULT_USERS[0].id;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => getStoredData('settings', INITIAL_SETTINGS));
  const [activities, setActivities] = useState<UserActivity[]>(() =>
    getStoredData('activities', INITIAL_ACTIVITIES)
  );

  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    getStoredData('inventory', INITIAL_INVENTORY)
  );
  const [sales, setSales] = useState<SaleRecord[]>(() => getStoredData('sales', []));
  const [purchases, setPurchases] = useState<PurchaseRecord[]>(() => getStoredData('purchases', []));
  const [customers, setCustomers] = useState<CustomerRecord[]>(() =>
    getStoredData('customers', INITIAL_CUSTOMERS)
  );
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(() =>
    getStoredData('customerPayments', [])
  );
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => getStoredData('suppliers', []));
  const [dailyOrders, setDailyOrders] = useState<DailyOrder[]>(() =>
    getStoredData('dailyOrders', INITIAL_ORDERS)
  );
  const [bundles, setBundles] = useState<ProductBundle[]>(() =>
    getStoredData('bundles', INITIAL_BUNDLES)
  );
  const [coupons, setCoupons] = useState<PromoCoupon[]>(() =>
    getStoredData('coupons', INITIAL_COUPONS)
  );
  const [writeOffs, setWriteOffs] = useState<WriteOffRecord[]>(() => getStoredData('writeOffs', []));
  const [returnsLog, setReturnsLog] = useState<ReturnRecord[]>(() => getStoredData('returnsLog', []));
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => getStoredData('expenses', []));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    getStoredData('stockMovements', [])
  );
  const [inventoryAudits, setInventoryAudits] = useState<InventoryAudit[]>(() =>
    getStoredData('inventoryAudits', [])
  );
  const [dailyClosures, setDailyClosures] = useState<DailyCloseRecord[]>(() =>
    getStoredData('dailyClosures', [])
  );

  // Find Active User
  const currentUser: User = users.find((u) => u.id === currentUserId) || users[0] || DEFAULT_USERS[0];

  // Initialize IndexedDB on startup
  useEffect(() => {
    initIndexedDb().catch(console.error);
  }, []);

  // Save changes to storage
  useEffect(() => {
    setStoredData('users', users);
  }, [users]);
  useEffect(() => {
    localStorage.setItem('current_user_id', currentUserId);
  }, [currentUserId]);
  useEffect(() => {
    setStoredData('settings', settings);
  }, [settings]);
  useEffect(() => {
    setStoredData('activities', activities);
  }, [activities]);
  useEffect(() => {
    setStoredData('inventory', inventory);
  }, [inventory]);
  useEffect(() => {
    setStoredData('sales', sales);
  }, [sales]);
  useEffect(() => {
    setStoredData('purchases', purchases);
  }, [purchases]);
  useEffect(() => {
    setStoredData('customers', customers);
  }, [customers]);
  useEffect(() => {
    setStoredData('customerPayments', customerPayments);
  }, [customerPayments]);
  useEffect(() => {
    setStoredData('suppliers', suppliers);
  }, [suppliers]);
  useEffect(() => {
    setDailyOrders((prev) => prev);
    setStoredData('dailyOrders', dailyOrders);
  }, [dailyOrders]);
  useEffect(() => {
    setStoredData('bundles', bundles);
  }, [bundles]);
  useEffect(() => {
    setStoredData('coupons', coupons);
  }, [coupons]);
  useEffect(() => {
    setStoredData('writeOffs', writeOffs);
  }, [writeOffs]);
  useEffect(() => {
    setStoredData('returnsLog', returnsLog);
  }, [returnsLog]);
  useEffect(() => {
    setStoredData('expenses', expenses);
  }, [expenses]);
  useEffect(() => {
    setStoredData('stockMovements', stockMovements);
  }, [stockMovements]);
  useEffect(() => {
    setStoredData('inventoryAudits', inventoryAudits);
  }, [inventoryAudits]);
  useEffect(() => {
    setStoredData('dailyClosures', dailyClosures);
  }, [dailyClosures]);

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
      setActivities((prev) => [newAct, ...prev.slice(0, 499)]); // keep latest 500
    },
    [currentUser]
  );

  // User Auth Actions
  const login = (username: string): boolean => {
    const clean = username.trim().toLowerCase();
    const found = users.find((u) => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);
    if (found) {
      setCurrentUserId(found.id);
      found.lastLogin = new Date().toISOString();
      setUsers((prev) => prev.map((u) => (u.id === found.id ? { ...u, lastLogin: found.lastLogin } : u)));
      logActivity('login', 'User Logged In', `${found.name} (${found.role}) logged in successfully.`);
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
      return { success: false, error: 'No account found with that email or username.' };
    }

    // Verify password if hash exists
    if (found.passwordHash) {
      const isValid = await verifyPassword(password, found.passwordHash, found.passwordSalt);
      if (!isValid) {
        playSound('delete', settings.soundEnabled);
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }
    }

    // Success login
    setCurrentUserId(found.id);
    const updatedLoginTime = new Date().toISOString();
    setUsers((prev) =>
      prev.map((u) => (u.id === found.id ? { ...u, lastLogin: updatedLoginTime } : u))
    );

    const loggedInUser = { ...found, lastLogin: updatedLoginTime };
    logActivity('login', 'User Authenticated', `${found.name} (${found.role}) logged in with secure credentials.`);
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

    // Check unique username and email
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: 'Username is already taken. Please choose another.' };
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Email address is already registered.' };
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
    logActivity(
      'register',
      'Account Created & Signed In',
      `Registered user profile for ${newUser.name} (@${newUser.username}) with ${newUser.role} credentials.`
    );
    playSound('success', settings.soundEnabled);
    return { success: true, user: newUser };
  };

  const registerUser = (
    username: string,
    email: string,
    name: string,
    role: UserRole
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
    logActivity(
      'register',
      'New User Registered',
      `Created user account for ${newUser.name} with role ${newUser.role}.`
    );
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

    // Check duplicate username or email if changed
    if (data.username && data.username.trim().toLowerCase() !== target.username.toLowerCase()) {
      const exists = users.some(
        (u) => u.id !== userId && u.username.toLowerCase() === data.username!.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: 'Username is already taken by another user.' };
      }
    }
    if (data.email && data.email.trim().toLowerCase() !== target.email.toLowerCase()) {
      const exists = users.some(
        (u) => u.id !== userId && u.email.toLowerCase() === data.email!.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: 'Email address is already in use by another user.' };
      }
    }

    const updatedUser: User = {
      ...target,
      name: data.name !== undefined ? data.name.trim() : target.name,
      email: data.email !== undefined ? data.email.trim().toLowerCase() : target.email,
      username: data.username !== undefined ? data.username.trim().toLowerCase() : target.username,
      avatarBg: data.avatarBg || target.avatarBg,
      avatarEmoji: data.avatarEmoji || target.avatarEmoji,
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    logActivity(
      'profile_update',
      'User Profile Updated',
      `${updatedUser.name} (@${updatedUser.username}) updated their account profile details.`
    );
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
      return { success: false, error: 'User not found.' };
    }

    if (target.passwordHash) {
      const isOldValid = await verifyPassword(oldPass, target.passwordHash, target.passwordSalt);
      if (!isOldValid) {
        return { success: false, error: 'Current password is incorrect.' };
      }
    }

    if (!newPass || newPass.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters.' };
    }

    const { hash, salt } = await hashPassword(newPass);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, passwordHash: hash, passwordSalt: salt } : u))
    );

    logActivity(
      'password_change',
      'Password Changed',
      `${target.name} updated their account security credentials.`
    );
    playSound('success', settings.soundEnabled);
    return { success: true };
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      logActivity('user_switch', 'User Switched', `Switched active session to ${target.name} (${target.role}).`);
      playSound('beep', settings.soundEnabled);
    }
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) {
      return { success: false, error: 'User account not found.' };
    }

    let remainingUsers = users.filter((u) => u.id !== userId);

    // If deleting the last user, create a clean default admin profile so the system is never left without an active session
    if (remainingUsers.length === 0) {
      remainingUsers = [DEFAULT_USERS[0]];
      setCurrentUserId(DEFAULT_USERS[0].id);
      localStorage.setItem('current_user_id', DEFAULT_USERS[0].id);
    } else if (currentUserId === userId) {
      // If deleting the current active user, switch to the first remaining user
      setCurrentUserId(remainingUsers[0].id);
      localStorage.setItem('current_user_id', remainingUsers[0].id);
    }

    setUsers(remainingUsers);
    setStoredData('users', remainingUsers);

    logActivity(
      'user_delete',
      'User Account Deleted',
      `Deleted user account for ${target.name} (@${target.username}) [${target.role}].`
    );
    playSound('delete', settings.soundEnabled);
    return { success: true };
  };

  const logout = () => {
    logActivity('logout', 'User Logged Out', `${currentUser.name} signed out of their session.`);
    playSound('beep', settings.soundEnabled);
    if (users.length > 0) {
      // Find guest/cashier or keep first user
      setCurrentUserId(users[0].id);
    }
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    logActivity('user_switch', 'User Role Updated', `Role updated for user ${userId} to ${role}.`);
  };

  const clearActivities = () => {
    setActivities([]);
    playSound('delete', settings.soundEnabled);
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const setPin = (pin: string) => {
    setSettings((prev) => ({ ...prev, adminPin: pin }));
  };

  // Till calculation
  const totalSalesVal = sales.reduce((s, r) => s + Number(r.total || 0), 0);
  const totalPurchVal = purchases.reduce((s, r) => s + Number(r.total || 0), 0);
  const totalExpVal = expenses.reduce((s, r) => s + Number(r.amount || 0), 0);
  const tillBalance = totalSalesVal - totalPurchVal - totalExpVal;

  // Inventory Actions
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = { id: generateId('inv'), ...itemData };
    setInventory((prev) => [...prev, newItem]);

    const move: StockMovement = {
      id: generateId('mov'),
      date: getTodayDateString(),
      type: 'PURCHASE',
      itemId: newItem.id,
      itemName: newItem.name,
      qty: newItem.qty,
      qtyChange: newItem.qty,
      previousQty: 0,
      newQty: newItem.qty,
      reference: 'Initial Catalog Item Creation',
      userId: currentUser.id,
      userName: currentUser.name,
    };
    setStockMovements((prev) => [move, ...prev]);
    logActivity('inventory_add', 'Product Added', `Added "${newItem.name}" (${newItem.qty} units @ ${newItem.price}).`);
    playSound('success', settings.soundEnabled);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const oldQty = it.qty;
          const updated = { ...it, ...updates };
          if (updates.qty !== undefined && updates.qty !== oldQty) {
            const diff = updates.qty - oldQty;
            const move: StockMovement = {
              id: generateId('mov'),
              date: getTodayDateString(),
              type: 'AUDIT_ADJUSTMENT',
              itemId: it.id,
              itemName: updated.name,
              qty: diff,
              qtyChange: diff,
              previousQty: oldQty,
              newQty: updates.qty,
              reference: 'Manual Inventory Edit',
              userId: currentUser.id,
              userName: currentUser.name,
            };
            setStockMovements((m) => [move, ...m]);
          }
          return updated;
        }
        return it;
      })
    );
    logActivity('inventory_edit', 'Product Updated', `Updated details for product ID: ${id}`);
    playSound('success', settings.soundEnabled);
  };

  const deleteInventoryItem = (id: string) => {
    const found = inventory.find((i) => i.id === id);
    setInventory((prev) => prev.filter((i) => i.id !== id));
    logActivity('inventory_delete', 'Product Deleted', `Removed "${found?.name || id}" from catalog.`);
    playSound('delete', settings.soundEnabled);
  };

  // Sales & POS Actions
  const recordSale = (saleData: Omit<SaleRecord, 'id' | 'cashierId' | 'cashierName'>, editingId?: string) => {
    const saleId = editingId || generateId('sale');
    const newItems = saleData.items;

    // Apply inventory stock deduction
    setInventory((prevInv) => {
      const invMap = new Map<string, InventoryItem>(prevInv.map((i) => [i.id, { ...i }]));

      // If editing existing sale, restore previous items
      if (editingId) {
        const oldSale = sales.find((s) => s.id === editingId);
        if (oldSale) {
          oldSale.items.forEach((it) => {
            if (it.isBundle && it.bundleItems) {
              it.bundleItems.forEach((bi: { name: string; qty: number }) => {
                const target = Array.from(invMap.values()).find(
                  (x) => x.name.toLowerCase() === bi.name.toLowerCase()
                );
                if (target) target.qty += (Number(bi.qty) || 1) * (Number(it.qty) || 1);
              });
            } else if (it.itemId && invMap.has(it.itemId)) {
              invMap.get(it.itemId)!.qty += Number(it.qty) || 0;
            }
          });
        }
      }

      // Deduct new items
      newItems.forEach((it) => {
        if (it.isBundle && it.bundleItems) {
          it.bundleItems.forEach((bi: { name: string; qty: number }) => {
            const target = Array.from(invMap.values()).find(
              (x) => x.name.toLowerCase() === bi.name.toLowerCase()
            );
            if (target) {
              const deduct = (Number(bi.qty) || 1) * (Number(it.qty) || 1);
              const prevQ = target.qty;
              target.qty = Math.max(0, target.qty - deduct);
              setStockMovements((m) => [
                {
                  id: generateId('mov'),
                  date: saleData.date || getTodayDateString(),
                  type: 'SALE',
                  itemId: target.id,
                  itemName: target.name,
                  qty: -deduct,
                  qtyChange: -deduct,
                  previousQty: prevQ,
                  newQty: target.qty,
                  reference: `Sale #${saleId} (Bundle Item)`,
                  userId: currentUser.id,
                  userName: currentUser.name,
                },
                ...m,
              ]);
            }
          });
        } else if (it.itemId && invMap.has(it.itemId)) {
          const target = invMap.get(it.itemId)!;
          const deduct = Number(it.qty) || 0;
          const prevQ = target.qty;
          target.qty = Math.max(0, target.qty - deduct);
          setStockMovements((m) => [
            {
              id: generateId('mov'),
              date: saleData.date || getTodayDateString(),
              type: 'SALE',
              itemId: target.id,
              itemName: target.name,
              qty: -deduct,
              qtyChange: -deduct,
              previousQty: prevQ,
              newQty: target.qty,
              reference: `Sale Invoice #${saleId}`,
              userId: currentUser.id,
              userName: currentUser.name,
            },
            ...m,
          ]);
        }
      });

      return Array.from(invMap.values());
    });

    const fullSaleRecord: SaleRecord = {
      ...saleData,
      id: saleId,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
    };

    if (editingId) {
      setSales((prev) => prev.map((s) => (s.id === editingId ? fullSaleRecord : s)));
      logActivity(
        'sale_edit',
        'Sale Modified',
        `Updated invoice #${saleId} (Total: ${settings.currency}${fullSaleRecord.total.toFixed(2)})`
      );
    } else {
      setSales((prev) => [fullSaleRecord, ...prev]);
      logActivity(
        'sale',
        'Sale Completed (POS)',
        `Recorded sale #${saleId} for ${saleData.customer || 'Walk-in'} totaling ${settings.currency}${fullSaleRecord.total.toFixed(2)} (${newItems.length} items).`
      );
    }

    playSound('cash', settings.soundEnabled);
  };

  const deleteSale = (id: string) => {
    const sale = sales.find((s) => s.id === id);
    if (!sale) return;

    // Restore stock
    setInventory((prevInv) => {
      const invMap = new Map<string, InventoryItem>(prevInv.map((i) => [i.id, { ...i }]));
      sale.items.forEach((it) => {
        if (it.isBundle && it.bundleItems) {
          it.bundleItems.forEach((bi: { name: string; qty: number }) => {
            const target = Array.from(invMap.values()).find(
              (x) => x.name.toLowerCase() === bi.name.toLowerCase()
            );
            if (target) target.qty += (Number(bi.qty) || 1) * (Number(it.qty) || 1);
          });
        } else if (it.itemId && invMap.has(it.itemId)) {
          invMap.get(it.itemId)!.qty += Number(it.qty) || 0;
        }
      });
      return Array.from(invMap.values());
    });

    setSales((prev) => prev.filter((s) => s.id !== id));
    logActivity('sale_delete', 'Sale Deleted', `Deleted invoice #${id} and restocked quantities.`);
    playSound('delete', settings.soundEnabled);
  };

  // Purchases
  const recordPurchase = (pData: Omit<PurchaseRecord, 'id' | 'recordedBy'>) => {
    const purchId = generateId('purch');
    let itemId = pData.itemId;
    let oldCost = 0;
    let newAvgCost = pData.cost;
    let prevQtyVal = 0;
    let newQtyVal = pData.qty;

    setInventory((prev) => {
      let found = pData.itemId
        ? prev.find((i) => i.id === pData.itemId)
        : prev.find((i) => i.name.toLowerCase() === pData.itemName.toLowerCase());

      if (found) {
        itemId = found.id;
        oldCost = Number(found.cost) || 0;
        prevQtyVal = Number(found.qty) || 0;
        newQtyVal = prevQtyVal + pData.qty;
        newAvgCost = newQtyVal > 0 ? (prevQtyVal * oldCost + pData.qty * pData.cost) / newQtyVal : pData.cost;

        return prev.map((i) =>
          i.id === found!.id
            ? {
                ...i,
                qty: newQtyVal,
                cost: newAvgCost,
              }
            : i
        );
      } else {
        const newItem: InventoryItem = {
          id: generateId('inv'),
          name: pData.itemName,
          qty: pData.qty,
          cost: pData.cost,
          price: pData.cost * 1.5,
          threshold: 5,
        };
        itemId = newItem.id;
        prevQtyVal = 0;
        newQtyVal = pData.qty;
        return [...prev, newItem];
      }
    });

    const fullRecord: PurchaseRecord = {
      ...pData,
      id: purchId,
      itemId,
      previousAverageCost: oldCost,
      newAverageCost: newAvgCost,
      recordedBy: currentUser.name,
    };

    setPurchases((prev) => [fullRecord, ...prev]);
    setStockMovements((m) => [
      {
        id: generateId('mov'),
        date: pData.date,
        type: 'PURCHASE',
        itemId: itemId || 'new',
        itemName: pData.itemName,
        qty: pData.qty,
        qtyChange: pData.qty,
        previousQty: prevQtyVal,
        newQty: newQtyVal,
        reference: `Purchase Invoice #${purchId} (${pData.supplier || 'Vendor'})`,
        userId: currentUser.id,
        userName: currentUser.name,
      },
      ...m,
    ]);

    logActivity(
      'purchase',
      'Stock Purchased',
      `Received ${pData.qty}x ${pData.itemName} from ${pData.supplier || 'vendor'} (Cost: ${settings.currency}${pData.total.toFixed(2)})`
    );
    playSound('success', settings.soundEnabled);
  };

  const deletePurchase = (id: string) => {
    const p = purchases.find((x) => x.id === id);
    if (!p) return;
    if (p.itemId) {
      setInventory((prev) =>
        prev.map((i) => (i.id === p.itemId ? { ...i, qty: Math.max(0, i.qty - p.qty) } : i))
      );
    }
    setPurchases((prev) => prev.filter((x) => x.id !== id));
    logActivity('purchase_delete', 'Purchase Deleted', `Removed purchase entry #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  // Customers & CRM
  const addCustomer = (custData: Omit<CustomerRecord, 'id' | 'createdAt'>): CustomerRecord => {
    const newCust: CustomerRecord = {
      ...custData,
      id: generateId('cust'),
      createdAt: getTodayDateString(),
    };
    setCustomers((prev) => [...prev, newCust]);
    logActivity('customer_add', 'Customer Added', `Added customer ${newCust.name} (${newCust.mobile})`);
    playSound('success', settings.soundEnabled);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<CustomerRecord>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    logActivity('customer_edit', 'Customer Updated', `Updated customer #${id}`);
    playSound('success', settings.soundEnabled);
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    logActivity('customer_delete', 'Customer Removed', `Deleted customer record #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  const recordCustomerPayment = (customerId: string, amount: number, date: string, note?: string) => {
    const payment: CustomerPayment = {
      id: generateId('cpay'),
      customerId,
      amount,
      date,
      note,
      recordedBy: currentUser.name,
    };
    setCustomerPayments((prev) => [payment, ...prev]);
    const cust = customers.find((c) => c.id === customerId);
    logActivity(
      'customer_payment',
      'Customer Debt Payment',
      `Recorded payment of ${settings.currency}${amount.toFixed(2)} from ${cust?.name || customerId}`
    );
    playSound('cash', settings.soundEnabled);
  };

  // Suppliers
  const addSupplier = (sup: Omit<SupplierRecord, 'id'>) => {
    const newSup: SupplierRecord = { id: generateId('sup'), ...sup };
    setSuppliers((prev) => [...prev, newSup]);
    logActivity('supplier_add', 'Supplier Added', `Added vendor ${newSup.name}`);
    playSound('success', settings.soundEnabled);
  };

  const updateSupplier = (id: string, sup: Partial<SupplierRecord>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...sup } : s)));
    logActivity('supplier_edit', 'Supplier Updated', `Updated vendor info for #${id}`);
    playSound('success', settings.soundEnabled);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    logActivity('supplier_delete', 'Supplier Deleted', `Removed supplier #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  // Daily Orders
  const addDailyOrder = (orderData: Omit<DailyOrder, 'id' | 'createdBy'>, editingId?: string) => {
    const orderId = editingId || generateId('ord');
    const fullOrder: DailyOrder = {
      ...orderData,
      id: orderId,
      createdBy: currentUser.name,
    };

    if (editingId) {
      setDailyOrders((prev) => prev.map((o) => (o.id === editingId ? fullOrder : o)));
      logActivity('order_edit', 'Order Updated', `Updated delivery order #${orderId} (${fullOrder.customerName})`);
    } else {
      setDailyOrders((prev) => [fullOrder, ...prev]);
      logActivity(
        'order_create',
        'Daily Order Created',
        `Created order #${orderId} for ${fullOrder.customerName} (Status: ${fullOrder.status})`
      );
    }
    playSound('success', settings.soundEnabled);
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setDailyOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const target = dailyOrders.find((o) => o.id === id);
    logActivity(
      'order_status',
      'Order Status Changed',
      `Order #${id} (${target?.customerName || ''}) changed to ${status}`
    );
    playSound('beep', settings.soundEnabled);
  };

  const deleteDailyOrder = (id: string) => {
    setDailyOrders((prev) => prev.filter((o) => o.id !== id));
    logActivity('order_delete', 'Order Deleted', `Removed daily order #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  // Bundles
  const saveBundle = (bundleData: Omit<ProductBundle, 'id'>, editingId?: string) => {
    const bundleId = editingId || generateId('bun');
    const fullBundle: ProductBundle = { ...bundleData, id: bundleId };

    if (editingId) {
      setBundles((prev) => prev.map((b) => (b.id === editingId ? fullBundle : b)));
      logActivity('bundle_edit', 'Bundle Updated', `Updated product bundle "${fullBundle.name}"`);
    } else {
      setBundles((prev) => [...prev, fullBundle]);
      logActivity(
        'bundle_create',
        'Bundle Created',
        `Created product package "${fullBundle.name}" (@ ${settings.currency}${fullBundle.price.toFixed(2)})`
      );
    }
    playSound('success', settings.soundEnabled);
  };

  const deleteBundle = (id: string) => {
    setBundles((prev) => prev.filter((b) => b.id !== id));
    logActivity('bundle_delete', 'Bundle Deleted', `Removed bundle #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  // Coupons
  const saveCoupon = (couponData: Omit<PromoCoupon, 'id' | 'usedCount'>, editingId?: string) => {
    const couponId = editingId || generateId('cp');
    const fullCoupon: PromoCoupon = {
      ...couponData,
      id: couponId,
      usedCount: editingId ? coupons.find((c) => c.id === editingId)?.usedCount || 0 : 0,
    };

    if (editingId) {
      setCoupons((prev) => prev.map((c) => (c.id === editingId ? fullCoupon : c)));
      logActivity('coupon_edit', 'Promo Code Updated', `Updated coupon "${fullCoupon.code}"`);
    } else {
      setCoupons((prev) => [...prev, fullCoupon]);
      logActivity(
        'coupon_create',
        'Promo Code Created',
        `Created promo code "${fullCoupon.code}" (${fullCoupon.type === 'percent' ? fullCoupon.value + '%' : settings.currency + fullCoupon.value} off)`
      );
    }
    playSound('success', settings.soundEnabled);
  };

  const useCoupon = (code: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.code.toUpperCase() === code.toUpperCase() ? { ...c, usedCount: c.usedCount + 1 } : c))
    );
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    logActivity('coupon_delete', 'Promo Code Deleted', `Deleted coupon #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  // Write-offs & Samples
  const recordWriteOff = (wData: Omit<WriteOffRecord, 'id' | 'recordedBy'>) => {
    const wId = generateId('woff');
    const fullW: WriteOffRecord = {
      ...wData,
      id: wId,
      recordedBy: currentUser.name,
    };

    let prevQ = 0;
    let newQ = 0;
    // Deduct stock
    setInventory((prev) =>
      prev.map((i) => {
        if (i.id === wData.itemId) {
          prevQ = i.qty;
          newQ = Math.max(0, i.qty - wData.qty);
          return { ...i, qty: newQ };
        }
        return i;
      })
    );

    // Add stock movement
    setStockMovements((m) => [
      {
        id: generateId('mov'),
        date: wData.date,
        type: 'WRITE_OFF',
        itemId: wData.itemId,
        itemName: wData.itemName,
        qty: -wData.qty,
        qtyChange: -wData.qty,
        previousQty: prevQ,
        newQty: newQ,
        reference: `${wData.type} Write-off: ${wData.note || 'None'}`,
        userId: currentUser.id,
        userName: currentUser.name,
      },
      ...m,
    ]);

    // Add to expenses
    const expId = generateId('exp');
    setExpenses((prev) => [
      {
        id: expId,
        date: wData.date,
        name: `${wData.type}: ${wData.itemName} (×${wData.qty})`,
        description: `${wData.type}: ${wData.itemName} (×${wData.qty})`,
        amount: wData.totalCost,
        category: wData.type === 'Damaged' ? 'Damaged Stock Write-off' : 'Promo Samples Write-off',
        note: wData.note || 'Automated write-off posting',
        recordedBy: currentUser.name,
      },
      ...prev,
    ]);

    setWriteOffs((prev) => [fullW, ...prev]);
    logActivity(
      'writeoff',
      `${wData.type} Recorded`,
      `Logged ${wData.qty}x ${wData.itemName} (Loss: ${settings.currency}${wData.totalCost.toFixed(2)})`
    );
    playSound('delete', settings.soundEnabled);
  };

  const deleteWriteOff = (id: string) => {
    setWriteOffs((prev) => prev.filter((w) => w.id !== id));
    logActivity('writeoff', 'Write-off Removed', `Deleted write-off record #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  // Returns
  const recordReturn = (rData: Omit<ReturnRecord, 'id' | 'recordedBy'>) => {
    const retId = generateId('ret');
    const isCust = rData.returnType === 'Customer' || rData.type === 'sale';
    const fullRet: ReturnRecord = {
      ...rData,
      id: retId,
      returnType: isCust ? 'Customer' : 'Supplier',
      type: isCust ? 'sale' : 'purchase',
      recordedBy: currentUser.name,
    };

    let prevQ = 0;
    let newQ = 0;
    setInventory((prev) =>
      prev.map((i) => {
        if (i.id === rData.itemId || i.name.toLowerCase() === rData.itemName.toLowerCase()) {
          prevQ = i.qty;
          newQ = isCust ? i.qty + rData.qty : Math.max(0, i.qty - rData.qty);
          return { ...i, qty: newQ };
        }
        return i;
      })
    );

    setStockMovements((m) => [
      {
        id: generateId('mov'),
        date: rData.date,
        type: 'RETURN',
        itemId: rData.itemId || 'unknown',
        itemName: rData.itemName,
        qty: isCust ? rData.qty : -rData.qty,
        qtyChange: isCust ? rData.qty : -rData.qty,
        previousQty: prevQ,
        newQty: newQ,
        reference: `${isCust ? 'Customer' : 'Supplier'} Return (${rData.reason || 'None'})`,
        userId: currentUser.id,
        userName: currentUser.name,
      },
      ...m,
    ]);

    setReturnsLog((prev) => [fullRet, ...prev]);
    logActivity(
      'return',
      `${isCust ? 'Customer' : 'Supplier'} Return`,
      `Processed return of ${rData.qty}x ${rData.itemName} (Refund: ${settings.currency}${rData.amount.toFixed(2)})`
    );
    playSound('beep', settings.soundEnabled);
  };

  const deleteReturn = (id: string) => {
    setReturnsLog((prev) => prev.filter((r) => r.id !== id));
    logActivity('return_delete', 'Return Entry Deleted', `Removed return record #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  // Expenses
  const recordExpense = (expData: { date: string; category: string; description: string; amount: number }) => {
    const newExp: ExpenseRecord = {
      id: generateId('exp'),
      date: expData.date,
      name: expData.description,
      description: expData.description,
      category: expData.category,
      amount: expData.amount,
      recordedBy: currentUser.name,
    };
    setExpenses((prev) => [newExp, ...prev]);
    logActivity(
      'expense',
      'Expense Recorded',
      `Logged expense "${newExp.description}" (${newExp.category}) of ${settings.currency}${newExp.amount.toFixed(2)}`
    );
    playSound('success', settings.soundEnabled);
  };

  const addExpense = (expData: Omit<ExpenseRecord, 'id' | 'recordedBy'>) => {
    recordExpense({
      date: expData.date,
      category: expData.category,
      description: expData.description || expData.name || 'Expense',
      amount: expData.amount,
    });
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logActivity('expense_delete', 'Expense Deleted', `Removed expense entry #${id}`);
    playSound('delete', settings.soundEnabled);
  };

  // Stocktake
  const recordStocktake = (itemId: string, physicalQty: number, note?: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    const diff = physicalQty - item.qty;
    const audit: InventoryAudit = {
      id: generateId('aud'),
      date: getTodayDateString(),
      itemId: item.id,
      itemName: item.name,
      systemQty: item.qty,
      physicalQty,
      diff,
      note,
      auditedBy: currentUser.name,
    };

    setInventoryAudits((prev) => [audit, ...prev]);
    setInventory((prev) => prev.map((i) => (i.id === itemId ? { ...i, qty: physicalQty } : i)));
    setStockMovements((m) => [
      {
        id: generateId('mov'),
        date: getTodayDateString(),
        type: 'AUDIT_ADJUSTMENT',
        itemId: item.id,
        itemName: item.name,
        qty: diff,
        qtyChange: diff,
        previousQty: item.qty,
        newQty: physicalQty,
        reference: `Physical stocktake audit (${note || 'Verified'})`,
        userId: currentUser.id,
        userName: currentUser.name,
      },
      ...m,
    ]);

    logActivity(
      'stocktake',
      'Stocktake Count Applied',
      `Audit for "${item.name}": System was ${audit.systemQty}, counted ${physicalQty} (Variance: ${diff >= 0 ? '+' : ''}${diff})`
    );
    playSound('success', settings.soundEnabled);
  };

  const performStocktake = (updates: { itemId: string; countedQty: number }[]) => {
    updates.forEach((u) => {
      recordStocktake(u.itemId, u.countedQty, 'Batch stocktake audit');
    });
  };

  // Daily Close
  const recordDailyClose = (closureData: Omit<DailyCloseRecord, 'id'>) => {
    const closure: DailyCloseRecord = {
      ...closureData,
      id: generateId('cls'),
    };
    setDailyClosures((prev) => [closure, ...prev.filter((c) => c.date !== closure.date)]);
    logActivity(
      'daily_close',
      'Daily Register Closed',
      `Closed register for ${closure.date} (Total: ${settings.currency}${closure.totalSales.toFixed(2)}, Actual: ${settings.currency}${closure.actualCash.toFixed(2)}, Diff: ${settings.currency}${closure.variance.toFixed(2)})`
    );
    playSound('cash', settings.soundEnabled);

    if (settings.autoWebhookDailyClose === 'yes' && settings.cloudWebhookUrl) {
      dispatchCloudWebhook('auto-daily-close');
    }
  };

  const recordDailyClosure = recordDailyClose;

  // Cloud Webhook
  const dispatchCloudWebhook = async (triggerSource: string): Promise<boolean> => {
    const url = settings.cloudWebhookUrl.trim();
    if (!url) return false;
    try {
      const payload = {
        app: 'Store Ledger & POS System',
        version: 5,
        timestamp: new Date().toISOString(),
        triggerSource,
        user: { id: currentUser.id, name: currentUser.name, role: currentUser.role },
        data: {
          inventory,
          sales,
          purchases,
          customers,
          expenses,
          activities: activities.slice(0, 50),
          dailyOrders,
          dailyClosures,
        },
      };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (e) {
      console.error('Webhook error:', e);
      return false;
    }
  };

  // Backup & Restore
  const exportFullBackup = (): string => {
    const backupObj = {
      app: 'Store Ledger & POS System',
      version: 5,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.name,
      data: {
        users,
        settings,
        activities,
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
      },
    };
    logActivity('backup_export', 'Full Database Backup Exported', `Generated full JSON backup payload.`);
    playSound('success', settings.soundEnabled);
    return JSON.stringify(backupObj, null, 2);
  };

  const exportAllDataAsJson = exportFullBackup;

  const importFullBackup = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      const d = parsed.data || parsed;
      if (d.users && Array.isArray(d.users)) setUsers(d.users);
      if (d.settings) setSettings((prev) => ({ ...prev, ...d.settings }));
      if (d.inventory && Array.isArray(d.inventory)) setInventory(d.inventory);
      if (d.sales && Array.isArray(d.sales)) setSales(d.sales);
      if (d.purchases && Array.isArray(d.purchases)) setPurchases(d.purchases);
      if (d.customers && Array.isArray(d.customers)) setCustomers(d.customers);
      if (d.customerPayments && Array.isArray(d.customerPayments)) setCustomerPayments(d.customerPayments);
      if (d.suppliers && Array.isArray(d.suppliers)) setSuppliers(d.suppliers);
      if (d.dailyOrders && Array.isArray(d.dailyOrders)) setDailyOrders(d.dailyOrders);
      if (d.bundles && Array.isArray(d.bundles)) setBundles(d.bundles);
      if (d.coupons && Array.isArray(d.coupons)) setCoupons(d.coupons);
      if (d.writeOffs && Array.isArray(d.writeOffs)) setWriteOffs(d.writeOffs);
      if (d.returnsLog && Array.isArray(d.returnsLog)) setReturnsLog(d.returnsLog);
      if (d.expenses && Array.isArray(d.expenses)) setExpenses(d.expenses);
      if (d.stockMovements && Array.isArray(d.stockMovements)) setStockMovements(d.stockMovements);
      if (d.inventoryAudits && Array.isArray(d.inventoryAudits)) setInventoryAudits(d.inventoryAudits);
      if (d.dailyClosures && Array.isArray(d.dailyClosures)) setDailyClosures(d.dailyClosures);
      if (d.activities && Array.isArray(d.activities)) setActivities(d.activities);

      logActivity('backup_import', 'Database Restored from Backup', `Imported backup from file.`);
      playSound('success', settings.soundEnabled);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  const importAllDataFromJson = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const ok = importFullBackup(jsonString);
      return ok ? { success: true } : { success: false, error: 'Malformed JSON payload structure.' };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const syncIndexedDbNow = async () => {
    setStoredData('users', users);
    setStoredData('settings', settings);
    setStoredData('activities', activities);
    setStoredData('inventory', inventory);
    setStoredData('sales', sales);
    setStoredData('purchases', purchases);
    setStoredData('customers', customers);
    setStoredData('customerPayments', customerPayments);
    setStoredData('suppliers', suppliers);
    setStoredData('dailyOrders', dailyOrders);
    setStoredData('bundles', bundles);
    setStoredData('coupons', coupons);
    setStoredData('writeOffs', writeOffs);
    setStoredData('returnsLog', returnsLog);
    setStoredData('expenses', expenses);
    setStoredData('stockMovements', stockMovements);
    setStoredData('inventoryAudits', inventoryAudits);
    setStoredData('dailyClosures', dailyClosures);

    logActivity('idb_sync', 'IndexedDB Synchronized', `Mirrored all 18 database collections into IndexedDB.`);
    playSound('success', settings.soundEnabled);
  };

  const recoverIndexedDbNow = async (): Promise<boolean> => {
    const data = await recoverFromIndexedDb();
    if (!data) return false;
    if (data.inventory) setInventory(data.inventory as InventoryItem[]);
    if (data.sales) setSales(data.sales as SaleRecord[]);
    if (data.customers) setCustomers(data.customers as CustomerRecord[]);
    if (data.users) setUsers(data.users as User[]);
    playSound('success', settings.soundEnabled);
    return true;
  };

  const resetToFactorySettings = () => {
    localStorage.clear();
    clearIndexedDbStore().catch(console.error);

    setUsers(DEFAULT_USERS);
    setCurrentUserId(DEFAULT_USERS[0].id);
    localStorage.setItem('current_user_id', DEFAULT_USERS[0].id);
    setSettings(INITIAL_SETTINGS);
    setInventory(INITIAL_INVENTORY);
    setSales([]);
    setPurchases([]);
    setCustomers(INITIAL_CUSTOMERS);
    setCustomerPayments([]);
    setSuppliers([]);
    setDailyOrders(INITIAL_ORDERS);
    setBundles(INITIAL_BUNDLES);
    setCoupons(INITIAL_COUPONS);
    setWriteOffs([]);
    setReturnsLog([]);
    setExpenses([]);
    setStockMovements([]);
    setInventoryAudits([]);
    setDailyClosures([]);
    setActivities(INITIAL_ACTIVITIES);

    // Save defaults to storage immediately
    setStoredData('users', DEFAULT_USERS);
    setStoredData('settings', INITIAL_SETTINGS);
    setStoredData('inventory', INITIAL_INVENTORY);
    setStoredData('sales', []);
    setStoredData('purchases', []);
    setStoredData('customers', INITIAL_CUSTOMERS);
    setStoredData('customerPayments', []);
    setStoredData('suppliers', []);
    setStoredData('dailyOrders', INITIAL_ORDERS);
    setStoredData('bundles', INITIAL_BUNDLES);
    setStoredData('coupons', INITIAL_COUPONS);
    setStoredData('writeOffs', []);
    setStoredData('returnsLog', []);
    setStoredData('expenses', []);
    setStoredData('stockMovements', []);
    setStoredData('inventoryAudits', []);
    setStoredData('dailyClosures', []);
    setStoredData('activities', INITIAL_ACTIVITIES);

    logActivity('wipe', 'System Reset to Factory Default', 'All store data was reset to demo sample catalog and users.');
    playSound('delete', settings.soundEnabled);
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
    const mode = options?.mode || 'blank';

    if (mode === 'factory') {
      resetToFactorySettings();
      return;
    }

    if (mode === 'transactions_only') {
      wipeTransactionsOnly();
      return;
    }

    // Complete Clean Slate Wipe: Everything to 0 records
    localStorage.clear();
    clearIndexedDbStore().catch(console.error);

    const freshAdmin: User = {
      ...DEFAULT_USERS[0],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    setUsers([freshAdmin]);
    setCurrentUserId(freshAdmin.id);
    localStorage.setItem('current_user_id', freshAdmin.id);

    setSettings(INITIAL_SETTINGS);
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

    // Persist empty slate
    setStoredData('users', [freshAdmin]);
    setStoredData('settings', INITIAL_SETTINGS);
    setStoredData('inventory', []);
    setStoredData('sales', []);
    setStoredData('purchases', []);
    setStoredData('customers', []);
    setStoredData('customerPayments', []);
    setStoredData('suppliers', []);
    setStoredData('dailyOrders', []);
    setStoredData('bundles', []);
    setStoredData('coupons', []);
    setStoredData('writeOffs', []);
    setStoredData('returnsLog', []);
    setStoredData('expenses', []);
    setStoredData('stockMovements', []);
    setStoredData('inventoryAudits', []);
    setStoredData('dailyClosures', []);
    setStoredData('activities', []);

    logActivity('wipe', 'Complete Store Data Wiped', 'All store inventory, sales, debts, orders, and extra accounts were wiped clean (0 records).');
    playSound('delete', settings.soundEnabled);
  };

  const wipeTransactionsOnly = () => {
    setSales([]);
    setPurchases([]);
    setCustomerPayments([]);
    setDailyOrders([]);
    setWriteOffs([]);
    setReturnsLog([]);
    setExpenses([]);
    setStockMovements([]);
    setInventoryAudits([]);
    setDailyClosures([]);
    setActivities([]);

    setStoredData('sales', []);
    setStoredData('purchases', []);
    setStoredData('customerPayments', []);
    setStoredData('dailyOrders', []);
    setStoredData('writeOffs', []);
    setStoredData('returnsLog', []);
    setStoredData('expenses', []);
    setStoredData('stockMovements', []);
    setStoredData('inventoryAudits', []);
    setStoredData('dailyClosures', []);
    setStoredData('activities', []);

    logActivity('wipe', 'Transactions Wiped', 'Wiped sales history, orders, expenses, and transaction records while keeping products and customers.');
    playSound('delete', settings.soundEnabled);
  };

  const wipeAllUsersExceptAdmin = () => {
    const adminUser = users.find((u) => u.role === 'admin') || DEFAULT_USERS[0];
    setUsers([adminUser]);
    setCurrentUserId(adminUser.id);
    localStorage.setItem('current_user_id', adminUser.id);
    setStoredData('users', [adminUser]);
    logActivity('wipe', 'User Profiles Cleared', `Removed all extra user accounts, keeping primary admin ${adminUser.name}.`);
    playSound('delete', settings.soundEnabled);
  };

  return (
    <StoreContext.Provider
      value={{
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
        tillBalance,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
