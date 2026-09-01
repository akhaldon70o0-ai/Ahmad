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
import { MultiStorePortal } from './components/MultiStorePortal';

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
import { TrialStatusBanner } from './components/TrialStatusBanner';
import { TrialUpgradeModal } from './components/TrialUpgradeModal';

function MainApp() {
  const { currentStore, inventory, addInventoryItem, logoutStore } = useStore();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [bundleInitialItem, setBundleInitialItem] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If no store is selected or active, show the MultiStorePortal
  if (!currentStore) {
    return <MultiStorePortal />;
  }

  const handleScanBarcode = (barcode: string) => {
    // Check if barcode belongs to item
    const found = inventory.find((i) => i.barcode === barcode);
    if (found) {
      setCurrentView('pos');
    } else {
      setCurrentView('inventory');
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
        {/* Trial Status Banner if store is in trial */}
        <TrialStatusBanner />

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
