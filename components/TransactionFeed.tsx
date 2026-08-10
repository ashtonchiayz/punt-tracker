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
import { Search, Filter, Trash2, Edit3, ArrowRight, Layers } from 'lucide-react';

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

  const filtered = transactions.filter((tx) => {
    // Currency filter
    if (activeCurrency !== 'all' && tx.currency !== activeCurrency) {
      return false;
    }
    // Category filter
    if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
      return false;
    }
    // Member filter
    if (selectedMember !== 'all' && tx.paidBy !== selectedMember && !tx.owers.includes(selectedMember)) {
      return false;
    }
    // Search query filter
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
    <div className="rounded-2xl bg-slate-900/60 p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Transaction Feed ({filtered.length})
            </h2>
            <p className="text-xs text-slate-400">Searchable history log of all group entries</p>
          </div>
        </div>

        {/* Filter Inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search bar */}
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Member Filter */}
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value as Member | 'all')}
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
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
            className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
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

      {/* Feed List */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
          <p className="text-sm font-medium text-slate-400">No matching transactions found.</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((tx) => {
            const payerInfo = MEMBER_INFO[tx.paidBy];
            const catObj = CATEGORIES.find((c) => c.id === tx.category);

            return (
              <div
                key={tx.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700/80 transition-all hover:bg-slate-900/40"
              >
                {/* Left info: Category Icon, Description, Date */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 border border-slate-800"
                    style={{ backgroundColor: payerInfo.bgLight }}
                  >
                    {catObj?.icon || '💳'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-slate-100 text-sm">{tx.description}</h4>

                      {/* Category Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          catObj?.color || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {tx.category}
                      </span>

                      {/* Currency Badge */}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {tx.currency}
                      </span>
                    </div>

                    {/* Paid by & split details */}
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <span>
                        Paid by <strong className="text-slate-200">{tx.paidBy}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Split: {tx.owers.join(', ')} ({tx.owers.length} person
                        {tx.owers.length === 1 ? '' : 's'})
                      </span>
                      <span>•</span>
                      <span className="text-slate-500 font-mono text-[11px]">{tx.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right info: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <div className="text-right">
                    <span className="font-mono text-base font-extrabold text-slate-100 block">
                      {formatAmount(tx.amount, tx.currency)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(tx)}
                      title="Edit entry"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      title="Delete entry"
                      className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
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
