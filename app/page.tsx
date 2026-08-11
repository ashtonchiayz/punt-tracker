'use client';

import React, { useState, useEffect } from 'react';
import { Member, Currency, Transaction } from '@/lib/types';
import { storageAdapter, StorageMode } from '@/lib/storage';
import { calculateNetBalances } from '@/lib/calculations';
import { Navbar } from '@/components/Navbar';
import { CurrencyTabs } from '@/components/CurrencyTabs';
import { KpiCards } from '@/components/KpiCards';
import { SimplifiedSettleUp } from '@/components/SimplifiedSettleUp';
import { PairwiseMatrix } from '@/components/PairwiseMatrix';
import { TransactionFeed } from '@/components/TransactionFeed';
import { ExpenseModal } from '@/components/ExpenseModal';
import { PlusCircle } from 'lucide-react';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<Currency | 'all'>('all');
  const [selectedMember, setSelectedMember] = useState<Member | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<StorageMode>('local');

  // Initial fetch and real-time subscription setup
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const initStorage = async () => {
      setIsLoading(true);
      setStorageMode(storageAdapter.getStorageMode());

      const loaded = await storageAdapter.fetchTransactions();
      setTransactions(loaded);
      setIsLoading(false);

      unsubscribe = storageAdapter.subscribeToTransactions((updated) => {
        setTransactions(updated);
      });
    };

    initStorage();

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshTransactions = async () => {
    const fresh = await storageAdapter.fetchTransactions();
    setTransactions(fresh);
  };

  // Handlers for storage updates
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updatedTx: Transaction = {
        ...txData,
        id: existingId,
        createdAt: editingTransaction?.createdAt || new Date().toISOString(),
      };
      await storageAdapter.updateTransaction(updatedTx);
    } else {
      await storageAdapter.addTransaction(txData);
    }
    await refreshTransactions();
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      await storageAdapter.deleteTransaction(id);
      await refreshTransactions();
    }
  };

  const handleResetSeed = async () => {
    if (confirm('Reset to exact debt tally from spreadsheet?')) {
      const seeded = await storageAdapter.resetToSeed();
      setTransactions(seeded);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Clear all transactions? This will erase all logged entries.')) {
      const cleared = await storageAdapter.clearAll();
      setTransactions(cleared);
    }
  };

  const handleQuickSettle = async (
    from: string,
    to: string,
    amount: number,
    currency: Currency
  ) => {
    await storageAdapter.addTransaction({
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

    await refreshTransactions();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-16 md:pb-0">
      {/* Ambient background lights */}
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
        storageMode={storageMode}
      />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Currency Scope Filter */}
        <CurrencyTabs activeCurrency={activeCurrency} onChange={setActiveCurrency} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium tracking-wide">Syncing transactions...</p>
          </div>
        ) : (
          <>
            {/* Member Balances Overview (Swipeable carousel on mobile) */}
            <section>
              <KpiCards
                balances={netBalances}
                activeCurrency={activeCurrency}
                selectedMember={selectedMember}
                onSelectMember={setSelectedMember}
              />
            </section>

            {/* Simplified Settle-Up Plan */}
            <section>
              <SimplifiedSettleUp
                transactions={transactions}
                activeCurrency={activeCurrency}
                onSettle={handleQuickSettle}
              />
            </section>

            {/* Transaction Feed Log */}
            <section>
              <TransactionFeed
                transactions={transactions}
                activeCurrency={activeCurrency}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteTransaction}
              />
            </section>

            {/* Collapsible Advanced Stats: Pairwise Debt Matrix */}
            <section>
              <PairwiseMatrix transactions={transactions} activeCurrency={activeCurrency} />
            </section>
          </>
        )}
      </main>

      {/* Mobile Sticky Floating Action Button (FAB) */}
      <button
        onClick={handleOpenAdd}
        className="md:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm rounded-full shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all border border-emerald-400/30"
      >
        <PlusCircle className="h-5 w-5" />
        <span>Add Expense</span>
      </button>

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
