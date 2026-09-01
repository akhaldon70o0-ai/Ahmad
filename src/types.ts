export type UserRole = 'admin' | 'manager' | 'cashier' | 'stockkeeper';

export interface StoreMeta {
  id: string;
  name: string;
  ownerEmail: string;
  ownerName: string;
  currency: string;
  adminPin?: string;
  createdAt: string;
  lastActive?: string;
  passwordHash?: string;
  passwordSalt?: string;
  description?: string;
  activationCode?: string;
  isApproved?: boolean;
  isTrial?: boolean;
  trialEndsAt?: string;
  planType?: 'trial' | 'full' | 'lifetime';
}

export interface StoreAccessRequest {
  id: string;
  businessName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  generatedCode?: string;
}

export interface ActivationCode {
  id: string;
  code: string;
  createdForEmail?: string;
  createdForBusiness?: string;
  isUsed: boolean;
  usedByStoreId?: string;
  usedAt?: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

export interface OwnerVerificationCode {
  email: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  isUsed: boolean;
  attempts: number;
}

export interface StoreUserRecord {
  email: string;
  username: string;
  name: string;
  role: UserRole;
  storeId: string;
  storeName: string;
  passwordHash?: string;
  passwordSalt?: string;
  pin?: string;
  lastLogin?: string;
}

export type AppView =
  | 'dashboard'
  | 'sales'
  | 'pos'
  | 'profile'
  | 'activities'
  | 'inventory'
  | 'bundles'
  | 'coupons'
  | 'damaged'
  | 'damaged-samples'
  | 'customers'
  | 'orders'
  | 'daily-orders'
  | 'purchases'
  | 'suppliers'
  | 'delivery'
  | 'movements'
  | 'stock-movements'
  | 'stocktake'
  | 'daily_close'
  | 'daily-close'
  | 'returns'
  | 'expenses'
  | 'reports'
  | 'backup'
  | 'migration';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  avatarBg: string;
  avatarEmoji: string;
  createdAt: string;
  lastLogin: string;
  passwordHash?: string;
  passwordSalt?: string;
}

export type ActivityActionType =
  | 'login'
  | 'logout'
  | 'register'
  | 'user_switch'
  | 'user_delete'
  | 'profile_update'
  | 'password_change'
  | 'sale'
  | 'sale_edit'
  | 'sale_delete'
  | 'purchase'
  | 'purchase_delete'
  | 'inventory_add'
  | 'inventory_edit'
  | 'inventory_delete'
  | 'stocktake'
  | 'writeoff'
  | 'customer_add'
  | 'customer_edit'
  | 'customer_delete'
  | 'customer_payment'
  | 'order_create'
  | 'order_edit'
  | 'order_status'
  | 'order_delete'
  | 'expense'
  | 'expense_delete'
  | 'supplier_add'
  | 'supplier_edit'
  | 'supplier_delete'
  | 'return'
  | 'return_delete'
  | 'coupon_create'
  | 'coupon_edit'
  | 'coupon_delete'
  | 'bundle_create'
  | 'bundle_edit'
  | 'bundle_delete'
  | 'daily_close'
  | 'backup_export'
  | 'backup_import'
  | 'idb_sync'
  | 'wipe';

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  actionType: ActivityActionType;
  title: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface InventoryItem {
  id: string;
  name: string;
  barcode?: string;
  category?: string;
  qty: number;
  cost: number;
  price: number;
  threshold: number;
}

export interface CartItem {
  itemId: string | null;
  bundleId: string | null;
  isBundle: boolean;
  bundleItems: { id: string | null; name: string; qty: number }[] | null;
  itemName: string;
  qty: number;
  price: number;
  cost: number | null;
  discountType: 'none' | 'percent' | 'fixed';
  discountValue: number;
}

export interface SaleRecord {
  id: string;
  date: string;
  customer?: string;
  items: CartItem[];
  subtotal: number;
  itemDiscountAmount: number;
  discountType: 'none' | 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  total: number;
  paidAmount: number;
  debt: number;
  paymentMethod: string;
  costTotal?: number;
  profit?: number;
  cashierId?: string;
  cashierName?: string;
}

export interface PurchaseRecord {
  id: string;
  date: string;
  itemId: string | null;
  itemName: string;
  qty: number;
  cost: number;
  total: number;
  supplier?: string;
  previousAverageCost?: number;
  newAverageCost?: number;
  recordedBy?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  notes?: string;
  createdAt?: string;
  totalDebt?: number;
  creditLimit?: number;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  note?: string;
  recordedBy?: string;
}

export interface SupplierRecord {
  id: string;
  name: string;
  mobile?: string;
  address?: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  date: string;
  note?: string;
}

export type OrderStatus = 'Ready' | 'Preparing' | 'With Courier' | 'Delivered' | 'Cancelled';

export interface DailyOrder {
  id: string;
  date: string;
  customerId?: string | null;
  customerName: string;
  phone: string;
  address: string;
  details: string;
  saleTotal: number;
  status: OrderStatus;
  deliveryPartner?: string;
  trackingNumber?: string;
  deliveryFee: number;
  expectedDelivery?: string;
  createdBy?: string;
}

export interface BundleItemDef {
  id: string | null;
  name: string;
  qty: number;
}

export interface ProductBundle {
  id: string;
  name: string;
  price: number;
  items: BundleItemDef[];
}

export interface PromoCoupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  limit: number | null;
  usedCount: number;
  expiry: string | null;
  active: boolean;
}

export interface WriteOffRecord {
  id: string;
  date: string;
  type: 'Damaged' | 'Sample';
  itemId: string;
  itemName: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  note?: string;
  recordedBy?: string;
}

export interface ReturnRecord {
  id: string;
  type?: 'sale' | 'purchase';
  returnType?: 'Customer' | 'Supplier';
  date: string;
  reference?: string;
  itemId: string | null;
  itemName: string;
  qty: number;
  amount: number;
  total?: number;
  reason?: string;
  recordedBy?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  name?: string;
  description: string;
  amount: number;
  category: string;
  note?: string;
  recordedBy?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  type: string;
  itemId: string;
  itemName: string;
  qty?: number;
  qtyChange?: number;
  previousQty?: number;
  newQty?: number;
  reference?: string;
  userId?: string;
  userName?: string;
}

export interface InventoryAudit {
  id: string;
  date: string;
  itemId: string;
  itemName: string;
  systemQty: number;
  physicalQty: number;
  diff: number;
  note?: string;
  auditedBy?: string;
}

export interface DailyCloseRecord {
  id: string;
  date: string;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  debtSales: number;
  totalExpenses: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  closedBy: string;
  notes?: string;
}

export type DailyClosure = DailyCloseRecord;

export interface StoreSettings {
  storeName: string;
  currency: string;
  adminPin: string;
  cloudWebhookUrl: string;
  autoWebhookDailyClose: 'yes' | 'no';
  soundEnabled: boolean;
  taxRate?: number;
  lowStockAlert?: boolean;
}
