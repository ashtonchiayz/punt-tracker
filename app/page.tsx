'use client';

import React, { useState, useEffect } from 'react';
import {
  Member,
  Currency,
  Transaction,
} from '@/lib/types';
import { storageAdapter } from '@/lib/storage';
import { calculateNetBalances } from '@/lib/calculations';
import { Navbar } from '@/components/Navbar';
import { CurrencyTabs } from '@/components/CurrencyTabs';
import { KpiCards } from '@/components/KpiCards';
import { SimplifiedSettleUp } from '@/components/SimplifiedSettleUp';
import { PairwiseMatrix } from '@/components/PairwiseMatrix';
import { TransactionFeed } from '@/components/TransactionFeed';
import { ExpenseModal } from '@/components/ExpenseModal';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<Currency | 'all'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load initial transactions on mount
  useEffect(() => {
    const loaded = storageAdapter.getTransactions();
    setTransactions(loaded);
  }, []);

  // Handlers for storage updates
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updatedTx: Transaction = {
        ...txData,
        id: existingId,
        createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      };
      storageAdapter.updateTransaction(updatedTx);
    } else {
      storageAdapter.addTransaction(txData);
    }
    setTransactions(storageAdapter.getTransactions());
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      storageAdapter.deleteTransaction(id);
      setTransactions(storageAdapter.getTransactions());
    }
  };

  const handleResetSeed = () => {
    if (confirm('Reset to exact debt tally from spreadsheet?')) {
      const seeded = storageAdapter.resetToSeed();
      setTransactions(seeded);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all transactions? This will erase all logged entries.')) {
      const cleared = storageAdapter.clearAll();
      setTransactions(cleared);
    }
  };

  const handleQuickSettle = (
    from: string,
    to: string,
    amount: number,
    currency: Currency
  ) => {
    // Log a settlement transaction
    storageAdapter.addTransaction({
      description: `Settlement: ${from} ➔ ${to}`,
      amount,
      currency,
      paidBy: from as Member,
      splitMode: 'equal',
      owers: [to as Member],
      category: 'Settlement',
      date: new Date().toISOString().split('T')[0],
      isSettlement: true,
    });

    setTransactions(storageAdapter.getTransactions());
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  // Calculate real-time net balances for active currency scope
  const netBalances = calculateNetBalances(transactions, activeCurrency);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Background radial ambient lights */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={handleOpenAdd}
        onResetSeed={handleResetSeed}
        onClearAll={handleClearAll}
        transactionCount={transactions.length}
      />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {/* Currency Tabs Filter */}
        <CurrencyTabs activeCurrency={activeCurrency} onChange={setActiveCurrency} />

        {/* 4 High-Level KPI Balance Cards */}
        <section>
          <KpiCards
            balances={netBalances}
            activeCurrency={activeCurrency}
            selectedMember={selectedMember}
            onSelectMember={setSelectedMember}
          />
        </section>

        {/* Simplified Debt Settle-Up Plan & Pairwise Matrix Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SimplifiedSettleUp
            transactions={transactions}
            activeCurrency={activeCurrency}
            onSettle={handleQuickSettle}
          />

          <PairwiseMatrix transactions={transactions} activeCurrency={activeCurrency} />
        </section>

        {/* Transaction Feed */}
        <section>
          <TransactionFeed
            transactions={transactions}
            activeCurrency={activeCurrency}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteTransaction}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-900 bg-slate-950/80 text-center text-xs text-slate-500">
        <p>Punt Tracker • Sidd, Chia, Yh, Cy Expense & Debt Ledger</p>
      </footer>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />
    </div>
  );
}
