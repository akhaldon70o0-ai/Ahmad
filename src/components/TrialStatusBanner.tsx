import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { TrialUpgradeModal } from './TrialUpgradeModal';

export const TrialStatusBanner: React.FC = () => {
  const { currentStore, trialDaysRemaining, isTrialExpired } = useStore();
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  if (!currentStore?.isTrial) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-300 font-medium">
          <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Zap className="w-3 h-3 text-amber-400" />
          </div>
          <span>
            {isTrialExpired ? (
              <strong className="text-rose-400 font-bold">
                ⚠️ 7-Day Free Trial Expired — Please upgrade to continue
              </strong>
            ) : (
              <span>
                <strong className="text-amber-200 font-bold">7-Day Free Trial Active:</strong>{' '}
                <span className="font-semibold text-white">
                  {trialDaysRemaining === 1 ? '1 day remaining' : `${trialDaysRemaining} days remaining`}
                </span>
                . All POS features & cloud synchronization are enabled.
              </span>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsUpgradeOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] shadow-sm transition-all cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Upgrade to Permanent License</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <TrialUpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        isExpired={isTrialExpired}
      />
    </>
  );
};
