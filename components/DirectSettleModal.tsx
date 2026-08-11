'use client';

import React, { useState, useEffect } from 'react';
import { Member, MEMBER_INFO, Currency } from '@/lib/types';
import { formatAmount } from '@/lib/calculations';
import { X, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DirectSettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSettle: (from: Member, to: Member, amount: number, currency: Currency) => void;
  debtor: Member;
  creditor: Member;
  totalOwed: number;
  currency: Currency;
}

export const DirectSettleModal: React.FC<DirectSettleModalProps> = ({
  isOpen,
  onClose,
  onConfirmSettle,
  debtor,
  creditor,
  totalOwed,
  currency,
}) => {
  const [settleType, setSettleType] = useState<'full' | 'partial'>('full');
  const [customAmount, setCustomAmount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSettleType('full');
      setCustomAmount(totalOwed.toString());
    }
  }, [isOpen, totalOwed]);

  if (!isOpen) return null;

  const debtorInfo = MEMBER_INFO[debtor];
  const creditorInfo = MEMBER_INFO[creditor];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let payAmount = totalOwed;

    if (settleType === 'partial') {
      const parsed = parseFloat(customAmount);
      if (isNaN(parsed) || parsed <= 0) {
        alert('Please enter a valid positive settlement amount.');
        return;
      }
      payAmount = Math.min(parsed, totalOwed);
    }

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    onConfirmSettle(debtor, creditor, payAmount, currency);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Settle Debt Directly</span>
            </h2>
            <p className="text-xs text-zinc-400">Record a full or partial settlement payment</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Transfer Flow Badges */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-black/60 border border-zinc-800">
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-base shadow-inner border border-white/10 shrink-0"
                style={{ backgroundColor: debtorInfo.bgLight, color: debtorInfo.color }}
              >
                {debtorInfo.avatar}
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Payer (Debtor)</span>
                <span className="font-bold text-white text-sm">{debtorInfo.name}</span>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-zinc-500 shrink-0" />

            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-base shadow-inner border border-white/10 shrink-0"
                style={{ backgroundColor: creditorInfo.bgLight, color: creditorInfo.color }}
              >
                {creditorInfo.avatar}
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">Recipient</span>
                <span className="font-bold text-white text-sm">{creditorInfo.name}</span>
              </div>
            </div>
          </div>

          {/* Owed Info */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Current Total Debt ({currency})
            </span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400">
              {formatAmount(totalOwed, currency)}
            </span>
          </div>

          {/* Settle Type Options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Settlement Amount Option
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettleType('full')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center min-h-[44px] ${
                  settleType === 'full'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                Full ({formatAmount(totalOwed, currency)})
              </button>

              <button
                type="button"
                onClick={() => setSettleType('partial')}
                className={`p-3 rounded-2xl border text-xs font-bold transition-all text-center min-h-[44px] ${
                  settleType === 'partial'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                    : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                Partial Amount
              </button>
            </div>
          </div>

          {/* Partial Custom Input */}
          {settleType === 'partial' && (
            <div className="space-y-1.5 animate-fadeIn">
              <label className="block text-xs font-semibold text-zinc-300">
                Custom Partial Amount ({currency})
              </label>
              <input
                type="number"
                step="any"
                required
                max={totalOwed}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter partial amount..."
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-black border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-full shadow-lg shadow-emerald-600/20 transition-all border border-emerald-400/20"
            >
              Confirm Settlement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
