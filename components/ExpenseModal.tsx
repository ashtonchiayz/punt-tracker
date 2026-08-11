'use client';

import React, { useState, useEffect } from 'react';
import {
  Member,
  MEMBERS,
  MEMBER_INFO,
  Currency,
  CURRENCIES,
  CategoryTag,
  CATEGORIES,
  SplitMode,
  Transaction,
} from '@/lib/types';
import { X, Trophy, Coins, CheckSquare, Square } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialData?: Transaction | null;
}

const PRESET_DESCRIPTIONS = ['Dinner', 'Spin class', 'Arb wager', 'Joint booking', 'Transport', 'Car rental'];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('r');
  const [paidBy, setPaidBy] = useState<Member>('Sidd');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [owers, setOwers] = useState<Member[]>(['Chia', 'Yh', 'Cy']);
  const [exactSplits, setExactSplits] = useState<Record<Member, string>>({
    Sidd: '',
    Chia: '',
    Yh: '',
    Cy: '',
  });
  const [category, setCategory] = useState<CategoryTag>('Bet');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setCurrency(initialData.currency);
      setPaidBy(initialData.paidBy);
      setSplitMode(initialData.splitMode);
      setOwers(initialData.owers);
      setCategory(initialData.category);
      setDate(initialData.date);
      if (initialData.exactSplits) {
        const exactObj: Record<Member, string> = { Sidd: '', Chia: '', Yh: '', Cy: '' };
        MEMBERS.forEach((m) => {
          exactObj[m] = initialData.exactSplits?.[m]?.toString() || '';
        });
        setExactSplits(exactObj);
      }
    } else {
      // Reset defaults: default winner is Sidd, so losers default to [Chia, Yh, Cy]
      setDescription('');
      setAmount('');
      setCurrency('r');
      setPaidBy('Sidd');
      setSplitMode('equal');
      setOwers(['Chia', 'Yh', 'Cy']);
      setExactSplits({ Sidd: '', Chia: '', Yh: '', Cy: '' });
      setCategory('Bet');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // When Winner (paidBy) changes, auto-deselect Winner from Losers (owers) list!
  const handleWinnerChange = (winner: Member) => {
    setPaidBy(winner);
    // Remove winner from losers list
    const updatedOwers = owers.filter((m) => m !== winner);
    if (updatedOwers.length === 0) {
      // Default to all other members if empty
      setOwers(MEMBERS.filter((m) => m !== winner));
    } else {
      setOwers(updatedOwers);
    }
  };

  const toggleOwer = (member: Member) => {
    if (owers.includes(member)) {
      if (owers.length > 1) {
        setOwers(owers.filter((m) => m !== member));
      }
    } else {
      setOwers([...owers, member]);
    }
  };

  const toggleSelectAllOwers = () => {
    const availableLosers = MEMBERS.filter((m) => m !== paidBy);
    if (owers.length === availableLosers.length) {
      // Keep at least 1 loser
      setOwers([availableLosers[0]]);
    } else {
      setOwers([...availableLosers]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (!description.trim()) {
      alert('Please enter a description.');
      return;
    }
    if (owers.length === 0) {
      alert('Please select at least one person who lost this amount.');
      return;
    }

    const exactObj: Partial<Record<Member, number>> = {};
    if (splitMode === 'exact') {
      owers.forEach((m) => {
        exactObj[m] = parseFloat(exactSplits[m]) || 0;
      });
    }

    onSave(
      {
        description: description.trim(),
        amount: parsedAmount,
        currency,
        paidBy,
        splitMode,
        owers,
        exactSplits: splitMode === 'exact' ? exactObj : undefined,
        category,
        date,
        isSettlement: category === 'Settlement',
      },
      initialData?.id
    );

    onClose();
  };

  const isBetCategory = category === 'Bet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              {initialData
                ? 'Edit Entry'
                : isBetCategory
                ? '🎲 Log Wager / Bet'
                : 'Log New Transaction'}
            </h2>
            <p className="text-xs text-slate-400">
              {isBetCategory
                ? 'Record who won and who lost money on a bet'
                : 'Record a shared transaction for the group'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category Selector at Top */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryTag)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">
              Quick Suggestions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DESCRIPTIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDescription(preset)}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isBetCategory ? 'e.g., FIFA wager, Arb bet' : 'e.g., Dinner, Spin class'}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-mono text-sm">$</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Currency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.id}
                  type="button"
                  onClick={() => setCurrency(curr.id)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    currency === curr.id
                      ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-mono text-xs font-bold">{curr.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Minimalist Winner Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" />
                <span>Winner (Who WON the money)</span>
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {MEMBERS.map((m) => {
                const info = MEMBER_INFO[m];
                const isSelected = paidBy === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleWinnerChange(m)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm">{info.avatar}</span>
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimalist Loser(s) Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5" />
                <span>Loser(s) (Who LOST the money)</span>
              </label>

              <button
                type="button"
                onClick={toggleSelectAllOwers}
                className="text-[11px] text-slate-400 hover:text-slate-200 font-medium"
              >
                {owers.length === MEMBERS.filter((m) => m !== paidBy).length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {MEMBERS.map((m) => {
                const info = MEMBER_INFO[m];
                const isWinner = paidBy === m;
                const isChecked = owers.includes(m);

                if (isWinner) {
                  return (
                    <div
                      key={m}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-slate-800/40 bg-slate-950/30 text-slate-600 text-xs font-medium cursor-not-allowed opacity-50"
                      title="Winner is automatically excluded from losers list"
                    >
                      <span className="text-sm">{info.avatar}</span>
                      <span>{info.name}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleOwer(m)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-semibold transition-all ${
                      isChecked
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm">{info.avatar}</span>
                    <span>{info.name}</span>
                    {isChecked ? (
                      <CheckSquare className="h-3.5 w-3.5 text-rose-400 ml-0.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-600 ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
            >
              {initialData ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
