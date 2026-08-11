'use client';

import React, { useState, useEffect } from 'react';
import { Member, Currency, Transaction } from '@/lib/types';
import { storageAdapter, StorageMode } from '@/lib/storage';
import { calculateNetBalances } from '@/lib/calculations';
import { Navbar } from '@/components/Navbar';
import { CurrencyTabs } from '@/components/CurrencyTabs';
import { KpiCards } from '@/components/KpiCards';
import { PairwiseMatrix } from '@/components/PairwiseMatrix';
import { PendingTransactions } from '@/components/PendingTransactions';
import { DirectSettleModal } from '@/components/DirectSettleModal';
import { TransactionFeed } from '@/components/TransactionFeed';
import { ExpenseModal } from '@/components/ExpenseModal';
import { Plus } from 'lucide-react';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<Currency | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalDefaultStatus, setModalDefaultStatus] = useState<'completed' | 'pending'>('completed');
  const [isLoading, setIsLoading] = useState(true);
  const [storageMode, setStorageMode] = useState<StorageMode>('local');

  // Direct Settlement Modal State
  const [directSettleTarget, setDirectSettleTarget] = useState<{
    debtor: Member;
    creditor: Member;
    totalOwed: number;
    currency: Currency;
  } | null>(null);

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
    if (confirm('Are you sure you want to delete this entry?')) {
      await storageAdapter.deleteTransaction(id);
      await refreshTransactions();
    }
  };

  const handleResolveBet = async (
    tx: Transaction,
    winner: Member,
    losers: Member[],
    finalAmount?: number
  ) => {
    const updatedTx: Transaction = {
      ...tx,
      paidBy: winner,
      owers: losers,
      amount: finalAmount ?? tx.amount,
      status: 'completed',
    };
    await storageAdapter.updateTransaction(updatedTx);
    await refreshTransactions();
  };

  const handleConfirmDirectSettle = async (
    debtor: Member,
    creditor: Member,
    amount: number,
    currency: Currency
  ) => {
    await storageAdapter.addTransaction({
      description: `Settlement: ${debtor} ➔ ${creditor}`,
      amount,
      currency,
      paidBy: debtor,
      splitMode: 'equal',
      owers: [creditor],
      category: 'Settlement',
      date: new Date().toISOString().split('T')[0],
      isSettlement: true,
      status: 'completed',
    });

    await refreshTransactions();
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalDefaultStatus(tx.status || 'completed');
    setIsModalOpen(true);
  };

  const handleOpenAdd = (defaultStatus?: 'completed' | 'pending') => {
    setEditingTransaction(null);
    setModalDefaultStatus(defaultStatus || 'completed');
    setIsModalOpen(true);
  };

  // Filter completed vs pending for history feed
  const completedTransactions = transactions.filter((t) => t.status !== 'pending');

  // Calculate real-time net balances for active currency scope
  const netBalances = calculateNetBalances(transactions, activeCurrency);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-blue-500 selection:text-white pb-20 md:pb-6">
      {/* Top Navbar */}
      <Navbar onOpenAddModal={() => handleOpenAdd('completed')} storageMode={storageMode} />

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

            {/* Pairwise Debt Matrix (Permanently visible section with click-to-settle) */}
            <section>
              <PairwiseMatrix
                transactions={transactions}
                activeCurrency={activeCurrency}
                onCellSettle={(debtor, creditor, amount, currency) =>
                  setDirectSettleTarget({ debtor, creditor, totalOwed: amount, currency })
                }
              />
            </section>

            {/* Pending Transactions / Bets Section */}
            <section>
              <PendingTransactions
                transactions={transactions}
                activeCurrency={activeCurrency}
                onResolveBet={handleResolveBet}
                onDeletePending={handleDeleteTransaction}
                onOpenAddModal={() => handleOpenAdd('pending')}
              />
            </section>

            {/* Main Completed Transaction History Feed */}
            <section>
              <TransactionFeed
                transactions={completedTransactions}
                activeCurrency={activeCurrency}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteTransaction}
              />
            </section>
          </>
        )}
      </main>

      {/* Mobile Sticky Floating Action Button (FAB) */}
      <button
        onClick={() => handleOpenAdd('completed')}
        className="md:hidden fixed bottom-5 right-5 z-40 flex items-center gap-2 min-h-[48px] px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-full shadow-2xl shadow-blue-600/40 active:scale-95 transition-all border border-blue-400/30"
      >
        <Plus className="h-5 w-5" />
        <span>Add Transaction</span>
      </button>

      {/* Direct Settlement Modal */}
      {directSettleTarget && (
        <DirectSettleModal
          isOpen={Boolean(directSettleTarget)}
          onClose={() => setDirectSettleTarget(null)}
          onConfirmSettle={handleConfirmDirectSettle}
          debtor={directSettleTarget.debtor}
          creditor={directSettleTarget.creditor}
          totalOwed={directSettleTarget.totalOwed}
          currency={directSettleTarget.currency}
        />
      )}

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
        defaultStatus={modalDefaultStatus}
      />
    </div>
  );
}
