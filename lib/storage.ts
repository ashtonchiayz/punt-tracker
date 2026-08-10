import { Transaction } from './types';
import { SEED_TRANSACTIONS } from './seedData';

const STORAGE_KEY = 'punt_tracker_transactions_v4';

export interface IStorageAdapter {
  getTransactions(): Transaction[];
  saveTransactions(transactions: Transaction[]): void;
  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction;
  updateTransaction(tx: Transaction): void;
  deleteTransaction(id: string): void;
  resetToSeed(): Transaction[];
  clearAll(): Transaction[];
}

export class LocalStorageAdapter implements IStorageAdapter {
  getTransactions(): Transaction[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse transactions from LocalStorage:', e);
      return [];
    }
  }

  saveTransactions(transactions: Transaction[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions:', e);
    }
  }

  addTransaction(txData: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
    const transactions = this.getTransactions();
    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...transactions];
    this.saveTransactions(updated);
    return newTx;
  }

  updateTransaction(updatedTx: Transaction): void {
    const transactions = this.getTransactions();
    const index = transactions.findIndex((t) => t.id === updatedTx.id);
    if (index !== -1) {
      transactions[index] = updatedTx;
      this.saveTransactions(transactions);
    }
  }

  deleteTransaction(id: string): void {
    const transactions = this.getTransactions();
    const filtered = transactions.filter((t) => t.id !== id);
    this.saveTransactions(filtered);
  }

  resetToSeed(): Transaction[] {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
    return [];
  }

  clearAll(): Transaction[] {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
    return [];
  }
}

export const storageAdapter = new LocalStorageAdapter();
