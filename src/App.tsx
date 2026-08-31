/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AppView } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';

import { DashboardView } from './views/DashboardView';
import { SalesPosView } from './views/SalesPosView';
import { UserActivitiesView } from './views/UserActivitiesView';
import { UserProfileView } from './views/UserProfileView';
import { InventoryView } from './views/InventoryView';
import { BundlesView } from './views/BundlesView';
import { CouponsView } from './views/CouponsView';
import { DamagedSamplesView } from './views/DamagedSamplesView';
import { CustomersCrmView } from './views/CustomersCrmView';
import { DailyOrdersView } from './views/DailyOrdersView';
import { PurchasesView } from './views/PurchasesView';
import { SuppliersView } from './views/SuppliersView';
import { DeliveryView } from './views/DeliveryView';
import { StockMovementsView } from './views/StockMovementsView';
import { StocktakeView } from './views/StocktakeView';
import { DailyCloseView } from './views/DailyCloseView';
import { ReturnsView } from './views/ReturnsView';
import { ExpensesView } from './views/ExpensesView';
import { ReportsView } from './views/ReportsView';
import { BackupRestoreView } from './views/BackupRestoreView';
import { MigrationView } from './views/MigrationView';

function MainApp() {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [bundleInitialItem, setBundleInitialItem] = useState<string | undefined>(undefined);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { inventory, currentUser, addInventoryItem } = useStore();

  const handleScanBarcode = (barcode: string) => {
    // Check if barcode belongs to item
    const found = inventory.find((i) => i.barcode === barcode);
    if (found) {
      alert(`Barcode recognized: ${found.name} (Stock: ${found.qty})`);
      setCurrentView('pos');
    } else {
      const createNew = window.confirm(`Scanned Barcode "${barcode}" is not registered. Add as a new product?`);
      if (createNew) {
        const prodName = window.prompt('Enter Product Name for barcode ' + barcode);
        if (prodName && prodName.trim()) {
          const price = parseFloat(window.prompt('Enter Selling Price:', '10.00') || '10');
          const cost = parseFloat(window.prompt('Enter Cost Price:', '6.00') || '6');
          addInventoryItem({
            name: prodName.trim(),
            barcode: barcode.trim(),
            qty: 1,
            cost: isNaN(cost) ? 0 : cost,
            price: isNaN(price) ? 0 : price,
            threshold: 5,
          });
          setCurrentView('inventory');
        }
      }
    }
  };

  const navigateToBundlesWithItem = (itemName?: string) => {
    setBundleInitialItem(itemName);
    setCurrentView('bundles');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v as AppView);
          setMobileMenuOpen(false);
        }}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Application Navbar */}
        <Navbar
          currentView={currentView}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onSelectView={(v) => setCurrentView(v as AppView)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {currentView === 'dashboard' && <DashboardView onNavigate={(view) => setCurrentView(view as AppView)} />}
            {(currentView === 'sales' || currentView === 'pos') && <SalesPosView onOpenScanner={() => setIsScannerOpen(true)} />}
            {currentView === 'profile' && <UserProfileView />}
            {currentView === 'activities' && <UserActivitiesView />}
            {currentView === 'inventory' && <InventoryView onNavigateToBundles={navigateToBundlesWithItem} />}
            {currentView === 'bundles' && <BundlesView initialItemName={bundleInitialItem} />}
            {currentView === 'coupons' && <CouponsView />}
            {currentView === 'damaged-samples' && <DamagedSamplesView />}
            {currentView === 'customers' && <CustomersCrmView />}
            {currentView === 'daily-orders' && <DailyOrdersView />}
            {currentView === 'purchases' && <PurchasesView />}
            {currentView === 'suppliers' && <SuppliersView />}
            {currentView === 'delivery' && <DeliveryView />}
            {currentView === 'stock-movements' && <StockMovementsView />}
            {currentView === 'stocktake' && <StocktakeView />}
            {currentView === 'daily-close' && <DailyCloseView />}
            {currentView === 'returns' && <ReturnsView />}
            {currentView === 'expenses' && <ExpensesView />}
            {currentView === 'reports' && <ReportsView />}
            {currentView === 'backup' && <BackupRestoreView />}
            {currentView === 'migration' && <MigrationView />}
          </div>
        </main>
      </div>

      {/* Global Auth & User Switching Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Camera-based Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleScanBarcode}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
