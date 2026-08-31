import {
  User,
  UserActivity,
  InventoryItem,
  SaleRecord,
  PurchaseRecord,
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
  StoreSettings,
} from '../types';
import { generateId, getTodayDateString } from '../utils/audio';

const DB_NAME = 'StoreLedgerAppDB';
const DB_VERSION = 1;
const DB_STORE = 'collections';

let idbInstance: IDBDatabase | null = null;

export async function initIndexedDb(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.indexedDB) return false;
  return new Promise((resolve) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => {
      idbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(true);
    };
    req.onerror = () => {
      resolve(false);
    };
  });
}

export function mirrorToIndexedDb(key: string, data: unknown) {
  if (!idbInstance) return;
  try {
    const tx = idbInstance.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put({ key, value: data, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.warn('IDB write failure for key:', key, e);
  }
}

export function clearIndexedDbStore(): Promise<boolean> {
  if (!idbInstance) return Promise.resolve(true);
  return new Promise((resolve) => {
    try {
      const tx = idbInstance!.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function recoverFromIndexedDb(): Promise<Record<string, unknown> | null> {
  if (!idbInstance) return null;
  return new Promise((resolve, reject) => {
    try {
      const tx = idbInstance!.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        if (!records.length) return resolve(null);
        const map: Record<string, unknown> = {};
        records.forEach((r: { key: string; value: unknown }) => {
          map[r.key] = r.value;
          localStorage.setItem(r.key, typeof r.value === 'string' ? r.value : JSON.stringify(r.value));
        });
        resolve(map);
      };
      req.onerror = () => reject(req.error);
    } catch (e) {
      reject(e);
    }
  });
}

// Initial Default Users
export const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    username: 'admin',
    email: 'admin@storeledger.io',
    name: 'Alex Admin',
    role: 'admin',
    avatarBg: 'bg-emerald-600',
    avatarEmoji: '🛡️',
    createdAt: '2026-01-01T08:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-cashier-1',
    username: 'cashier',
    email: 'cashier@storeledger.io',
    name: 'Jane Cashier',
    role: 'cashier',
    avatarBg: 'bg-teal-600',
    avatarEmoji: '🛒',
    createdAt: '2026-01-10T09:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'user-manager-1',
    username: 'manager',
    email: 'manager@storeledger.io',
    name: 'Marcus Manager',
    role: 'manager',
    avatarBg: 'bg-indigo-600',
    avatarEmoji: '👔',
    createdAt: '2026-01-15T10:00:00.000Z',
    lastLogin: new Date().toISOString(),
  },
];

// Initial Demo Products
export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', name: 'Premium Organic Coffee Beans (1kg)', barcode: '629100100201', category: 'Beverages', qty: 28, cost: 9.5, price: 18.0, threshold: 8 },
  { id: 'inv-2', name: 'Artisan Dark Roast Ground Coffee (500g)', barcode: '629100100202', category: 'Beverages', qty: 15, cost: 5.2, price: 11.5, threshold: 5 },
  { id: 'inv-3', name: 'Stainless Steel Travel Thermal Mug', barcode: '629100100203', category: 'Accessories', qty: 22, cost: 8.0, price: 19.99, threshold: 6 },
  { id: 'inv-4', name: 'Organic Colombian Drip Bags (Pack of 10)', barcode: '629100100204', category: 'Beverages', qty: 4, cost: 4.5, price: 9.5, threshold: 6 },
  { id: 'inv-5', name: 'Manual Burr Coffee Grinder', barcode: '629100100205', category: 'Equipment', qty: 12, cost: 14.0, price: 32.0, threshold: 4 },
  { id: 'inv-6', name: 'Natural Raw Honeycomb Jar (350g)', barcode: '629100100206', category: 'Pantry', qty: 18, cost: 6.0, price: 13.5, threshold: 5 },
  { id: 'inv-7', name: 'Old Harvest Green Tea Blend', barcode: '629100100207', category: 'Tea', qty: 14, cost: 3.5, price: 8.0, threshold: 4 },
];

export const INITIAL_BUNDLES: ProductBundle[] = [
  {
    id: 'bun-1',
    name: 'Coffee Lover Starter Pack',
    price: 36.0,
    items: [
      { id: 'inv-1', name: 'Premium Organic Coffee Beans (1kg)', qty: 1 },
      { id: 'inv-3', name: 'Stainless Steel Travel Thermal Mug', qty: 1 },
    ],
  },
  {
    id: 'bun-2',
    name: 'Barista Morning Duo',
    price: 46.0,
    items: [
      { id: 'inv-2', name: 'Artisan Dark Roast Ground Coffee (500g)', qty: 2 },
      { id: 'inv-5', name: 'Manual Burr Coffee Grinder', qty: 1 },
    ],
  },
];

export const INITIAL_COUPONS: PromoCoupon[] = [
  { id: 'cp-1', code: 'WELCOME10', type: 'percent', value: 10, limit: 100, usedCount: 4, expiry: '2026-12-31', active: true },
  { id: 'cp-2', code: 'SAVE5', type: 'fixed', value: 5, limit: 50, usedCount: 2, expiry: '2026-12-31', active: true },
  { id: 'cp-3', code: 'VIP20', type: 'percent', value: 20, limit: 20, usedCount: 1, expiry: '2026-12-31', active: true },
];

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  { id: 'cust-1', name: 'Sarah Jenkins', mobile: '0798123456', address: '42 Baker St, Downtown', notes: 'Prefers dark roast', createdAt: '2026-02-01' },
  { id: 'cust-2', name: 'Michael Al-Omari', mobile: '0789654321', address: '18 Garden District, Apt 304', notes: 'VIP Corporate Account', createdAt: '2026-02-05' },
  { id: 'cust-3', name: 'Emma Watson', mobile: '0771239876', address: 'Westside Commerce Blvd #12', notes: 'Weekly delivery customer', createdAt: '2026-02-12' },
];

export const INITIAL_ORDERS: DailyOrder[] = [
  {
    id: 'ord-101',
    date: getTodayDateString(),
    customerId: 'cust-1',
    customerName: 'Sarah Jenkins',
    phone: '0798123456',
    address: '42 Baker St, Downtown',
    details: '1x Premium Organic Coffee Beans (1kg), 1x Stainless Steel Travel Thermal Mug',
    saleTotal: 37.99,
    status: 'Ready',
    deliveryPartner: 'Express Couriers',
    trackingNumber: 'TRK-889201',
    deliveryFee: 3.5,
    expectedDelivery: getTodayDateString(),
    createdBy: 'Jane Cashier',
  },
  {
    id: 'ord-102',
    date: getTodayDateString(),
    customerId: 'cust-2',
    customerName: 'Michael Al-Omari',
    phone: '0789654321',
    address: '18 Garden District, Apt 304',
    details: '2x Artisan Dark Roast Ground Coffee (500g)',
    saleTotal: 23.0,
    status: 'Preparing',
    deliveryPartner: 'Local Van #4',
    trackingNumber: 'LV-409',
    deliveryFee: 2.0,
    expectedDelivery: getTodayDateString(),
    createdBy: 'Alex Admin',
  },
];

export const INITIAL_SETTINGS: StoreSettings = {
  storeName: 'Apex Store Ledger & POS',
  currency: '$',
  adminPin: '1234',
  cloudWebhookUrl: '',
  autoWebhookDailyClose: 'yes',
  soundEnabled: true,
};

export const INITIAL_ACTIVITIES: UserActivity[] = [
  {
    id: generateId('act'),
    userId: 'user-admin-1',
    userName: 'Alex Admin',
    userRole: 'admin',
    actionType: 'login',
    title: 'System Initialized',
    details: 'Store ledger database loaded with initial catalog and user authentication.',
    timestamp: new Date().toISOString(),
  },
];

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    mirrorToIndexedDb(key, value);
  } catch (e) {
    console.error('Storage write error for key:', key, e);
  }
}
