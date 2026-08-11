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
import { Plus } from 'lucide-react';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<Currency | 'all'>('all');
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
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-blue-500 selection:text-white pb-20 md:pb-6">
      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={handleOpenAdd}
        storageMode={storageMode}
      />

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Currency Scope Filter */}
        <CurrencyTabs activeCurrency={activeCurrency} onChange={setActiveCurrency} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-zinc-400">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium tracking-wide">Syncing transactions...</p>
          </div>
        ) : (
          <>
            {/* Member Balances Overview (Swipeable carousel on mobile) */}
            <section>
              <KpiCards balances={netBalances} activeCurrency={activeCurrency} />
            </section>

            {/* Simplified Settle-Up Plan & Pairwise Matrix Grid (2-col desktop, 1-col mobile) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimplifiedSettleUp
                transactions={transactions}
                activeCurrency={activeCurrency}
                onSettle={handleQuickSettle}
              />

              <PairwiseMatrix transactions={transactions} activeCurrency={activeCurrency} />
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
          </>
        )}
      </main>

      {/* Mobile Sticky Floating Action Button (FAB) (Min 48px touch target) */}
      <button
        onClick={handleOpenAdd}
        className="md:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 min-h-[48px] px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-full shadow-2xl shadow-blue-600/40 active:scale-95 transition-all border border-blue-400/30"
      >
        <Plus className="h-5 w-5" />
        <span>Add Transaction</span>
      </button>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-white/10 bg-black text-center text-xs text-zinc-500">
        <p>Punt Tracker • Sidd, Chia, Yh, Cy Shared Expense & Debt Ledger</p>
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
