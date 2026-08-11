'use client';

import React, { useState } from 'react';
import {
  Member,
  MEMBERS,
  MEMBER_INFO,
  Currency,
  CategoryTag,
  CATEGORIES,
  Transaction,
} from '@/lib/types';
import { formatAmount } from '@/lib/calculations';
import { Search, Trash2, Edit3, Layers, Filter } from 'lucide-react';

interface TransactionFeedProps {
  transactions: Transaction[];
  activeCurrency: Currency | 'all';
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({
  transactions,
  activeCurrency,
  onEdit,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryTag | 'all'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = transactions.filter((tx) => {
    if (activeCurrency !== 'all' && tx.currency !== activeCurrency) return false;
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;
    if (
      selectedMember !== 'all' &&
      tx.paidBy !== selectedMember &&
      !tx.owers.includes(selectedMember)
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      const matchPayer = tx.paidBy.toLowerCase().includes(q);
      if (!matchDesc && !matchAmount && !matchPayer) return false;
    }

    return true;
  });

  return (
    <div className="rounded-2xl bg-slate-900/60 p-4 sm:p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Transaction Feed</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {filtered.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">History log of group entries</p>
            </div>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1 text-xs font-semibold"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Inputs Bar */}
        <div
          className={`${
            showFilters ? 'flex' : 'hidden sm:flex'
          } flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 sm:pt-0`}
        >
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Member Filter */}
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value as Member | 'all')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Members</option>
              {MEMBERS.map((m) => (
                <option key={m} value={m}>
                  {MEMBER_INFO[m].name}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryTag | 'all')}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Feed List */}
      {filtered.length === 0 ? (
        <div className="p-6 sm:p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <p className="text-xs sm:text-sm font-semibold text-slate-400">No matching transactions found.</p>
          <p className="text-[11px] text-slate-500 mt-1">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((tx) => {
            const payerInfo = MEMBER_INFO[tx.paidBy];
            const catObj = CATEGORIES.find((c) => c.id === tx.category);

            return (
              <div
                key={tx.id}
                className="group flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all hover:bg-slate-900/50"
              >
                {/* Left: Avatar + Title & Meta */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 border border-slate-800 shadow-inner"
                    style={{ backgroundColor: payerInfo.bgLight }}
                  >
                    {catObj?.icon || '💳'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                        {tx.description}
                      </h4>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                        {tx.currency}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                      <span>
                        Paid by <strong className="text-slate-200">{tx.paidBy}</strong>
                      </span>
                      <span>•</span>
                      <span className="truncate">
                        Split: {tx.owers.join(', ')}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">{tx.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-100 whitespace-nowrap">
                    {formatAmount(tx.amount, tx.currency)}
                  </span>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onEdit(tx)}
                      title="Edit entry"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      title="Delete entry"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
