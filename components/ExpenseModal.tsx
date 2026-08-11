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
import { X, Trophy, Coins, CheckSquare, Square, Hourglass } from 'lucide-react';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id' | 'createdAt'>, existingId?: string) => void;
  initialData?: Transaction | null;
  defaultStatus?: 'completed' | 'pending';
}

const PRESET_DESCRIPTIONS = ['Dinner', 'Spin class', 'Arb wager', 'Joint booking', 'Transport', 'Car rental'];

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultStatus = 'completed',
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
  const [status, setStatus] = useState<'completed' | 'pending'>('completed');

  // Pending Wager specific fields
  const [bettor, setBettor] = useState<Member>('Chia');
  const [opponent, setOpponent] = useState<Member>('Yh');

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
      setStatus(initialData.status || 'completed');
      setBettor(initialData.bettor || initialData.paidBy || 'Chia');
      setOpponent(initialData.opponent || (initialData.owers && initialData.owers[0]) || 'Yh');
      if (initialData.exactSplits) {
        const exactObj: Record<Member, string> = { Sidd: '', Chia: '', Yh: '', Cy: '' };
        MEMBERS.forEach((m) => {
          exactObj[m] = initialData.exactSplits?.[m]?.toString() || '';
        });
        setExactSplits(exactObj);
      }
    } else {
      setDescription('');
      setAmount('');
      setCurrency('r');
      setPaidBy('Sidd');
      setSplitMode('equal');
      setOwers(['Chia', 'Yh', 'Cy']);
      setExactSplits({ Sidd: '', Chia: '', Yh: '', Cy: '' });
      setCategory('Bet');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus(defaultStatus);
      setBettor('Chia');
      setOpponent('Yh');
    }
  }, [initialData, isOpen, defaultStatus]);

  if (!isOpen) return null;

  const handleWinnerChange = (winner: Member) => {
    setPaidBy(winner);
    const updatedOwers = owers.filter((m) => m !== winner);
    if (updatedOwers.length === 0) {
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

    const exactObj: Partial<Record<Member, number>> = {};
    if (splitMode === 'exact') {
      owers.forEach((m) => {
        exactObj[m] = parseFloat(exactSplits[m]) || 0;
      });
    }

    if (status === 'pending') {
      onSave(
        {
          description: description.trim(),
          amount: parsedAmount,
          currency,
          paidBy: bettor,
          splitMode: 'equal',
          owers: [opponent],
          category: 'Bet',
          date,
          isSettlement: false,
          status: 'pending',
          bettor,
          opponent,
        },
        initialData?.id
      );
    } else {
      if (owers.length === 0) {
        alert('Please select at least one person who lost this amount.');
        return;
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
          status: 'completed',
        },
        initialData?.id
      );
    }

    onClose();
  };

  const isBetCategory = category === 'Bet';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden my-8 text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/50">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {initialData
                ? 'Edit Transaction'
                : status === 'pending'
                ? '🎲 Log Pending Bet'
                : isBetCategory
                ? '🎲 Log Completed Wager'
                : 'Log New Transaction'}
            </h2>
            <p className="text-xs text-zinc-400">
              {status === 'pending'
                ? 'Record a pending bet to decide win/loss later'
                : 'Record a completed group transaction'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Entry Status Segmented Control */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Transaction Status Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black border border-white/10">
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
                  status === 'completed'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Completed Entry
              </button>
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all min-h-[44px] flex items-center justify-center gap-1.5 ${
                  status === 'pending'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Hourglass className="h-3.5 w-3.5" />
                <span>Pending Bet (TBD)</span>
              </button>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryTag)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-black border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-black border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 mb-1 uppercase tracking-wider">
              Quick Suggestions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DESCRIPTIONS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDescription(preset)}
                  className="px-3 py-1 text-xs rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-white/5"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isBetCategory || status === 'pending' ? 'e.g., FIFA wager, Arsenal vs Chelsea' : 'e.g., Dinner, Car rental'}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-black border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-zinc-500 font-mono text-xs font-bold">$</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-h-[44px] pl-7 pr-3.5 py-2 rounded-2xl bg-black border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Currency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr.id}
                  type="button"
                  onClick={() => setCurrency(curr.id)}
                  className={`p-2.5 rounded-2xl text-left border transition-all min-h-[44px] ${
                    currency === curr.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-black border-white/10 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-mono text-xs">{curr.shortLabel} [{curr.symbol}]</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pending Bet Specific Bettor vs Opponent selection */}
          {status === 'pending' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-black/60 border border-zinc-800">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1">
                  Bettor (Making the wager)
                </label>
                <select
                  value={bettor}
                  onChange={(e) => {
                    const b = e.target.value as Member;
                    setBettor(b);
                    if (opponent === b) {
                      setOpponent(MEMBERS.find((m) => m !== b) || 'Yh');
                    }
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-black border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                >
                  {MEMBERS.map((m) => (
                    <option key={m} value={m}>
                      {MEMBER_INFO[m].avatar} {MEMBER_INFO[m].name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Opponent (Target person)
                </label>
                <select
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value as Member)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-black border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  {MEMBERS.filter((m) => m !== bettor).map((m) => (
                    <option key={m} value={m}>
                      {MEMBER_INFO[m].avatar} {MEMBER_INFO[m].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Winner Section */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Winner (Who WON the money)</span>
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {MEMBERS.map((m) => {
                    const info = MEMBER_INFO[m];
                    const isSelected = paidBy === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleWinnerChange(m)}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-2xl border text-xs font-semibold transition-all min-h-[44px] ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                            : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-sm">{info.avatar}</span>
                        <span>{info.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Loser(s) Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5" />
                    <span>Loser(s) (Who LOST the money)</span>
                  </label>

                  <button
                    type="button"
                    onClick={toggleSelectAllOwers}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 font-medium"
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
                          className="flex items-center justify-center gap-1.5 p-2 rounded-2xl border border-zinc-800/40 bg-black/30 text-zinc-600 text-xs font-medium cursor-not-allowed opacity-40 min-h-[44px]"
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
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-2xl border text-xs font-semibold transition-all min-h-[44px] ${
                          isChecked
                            ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                            : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-sm">{info.avatar}</span>
                        <span>{info.name}</span>
                        {isChecked ? (
                          <CheckSquare className="h-3.5 w-3.5 text-rose-400 ml-0.5" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-zinc-600 ml-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
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
              className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg shadow-blue-600/20 transition-all border border-blue-400/20"
            >
              {initialData ? 'Update Entry' : status === 'pending' ? 'Save Pending Bet' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
