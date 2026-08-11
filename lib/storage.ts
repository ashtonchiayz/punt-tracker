import { Transaction } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY = 'punt_tracker_transactions_v4';

export type StorageMode = 'supabase' | 'local';

export interface DBTransaction {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_mode: string;
  owers: string[];
  exact_splits: Record<string, number> | null;
  category: string;
  date: string;
  created_at: string;
  is_settlement: boolean;
}

export function dbRowToTransaction(row: DBTransaction): Transaction {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency as any,
    paidBy: row.paid_by as any,
    splitMode: row.split_mode as any,
    owers: (row.owers || []) as any,
    exactSplits: row.exact_splits || undefined,
    category: row.category as any,
    date: row.date,
    createdAt: row.created_at,
    isSettlement: Boolean(row.is_settlement),
  };
}

export function transactionToDbRow(tx: Transaction): DBTransaction {
  return {
    id: tx.id,
    description: tx.description,
    amount: tx.amount,
    currency: tx.currency,
    paid_by: tx.paidBy,
    split_mode: tx.splitMode,
    owers: tx.owers,
    exact_splits: tx.exactSplits ? (tx.exactSplits as Record<string, number>) : null,
    category: tx.category,
    date: tx.date,
    created_at: tx.createdAt,
    is_settlement: Boolean(tx.isSettlement),
  };
}

export interface IStorageAdapter {
  getStorageMode(): StorageMode;
  fetchTransactions(): Promise<Transaction[]>;
  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  updateTransaction(tx: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  resetToSeed(): Promise<Transaction[]>;
  clearAll(): Promise<Transaction[]>;
  subscribeToTransactions(onUpdate: (transactions: Transaction[]) => void): () => void;
}

export class LocalStorageAdapter implements IStorageAdapter {
  getStorageMode(): StorageMode {
    return 'local';
  }

  getTransactionsSync(): Transaction[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse LocalStorage transactions:', e);
      return [];
    }
  }

  async fetchTransactions(): Promise<Transaction[]> {
    return this.getTransactionsSync();
  }

  private saveSync(txs: Transaction[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
    } catch (e) {
      console.error('Failed to save to LocalStorage:', e);
    }
  }

  async addTransaction(txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const list = this.getTransactionsSync();
    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };
    const updated = [newTx, ...list];
    this.saveSync(updated);
    return newTx;
  }

  async updateTransaction(updatedTx: Transaction): Promise<void> {
    const list = this.getTransactionsSync();
    const idx = list.findIndex((t) => t.id === updatedTx.id);
    if (idx !== -1) {
      list[idx] = updatedTx;
      this.saveSync(list);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const list = this.getTransactionsSync();
    const filtered = list.filter((t) => t.id !== id);
    this.saveSync(filtered);
  }

  async resetToSeed(): Promise<Transaction[]> {
    this.saveSync([]);
    return [];
  }

  async clearAll(): Promise<Transaction[]> {
    this.saveSync([]);
    return [];
  }

  subscribeToTransactions(_onUpdate: (transactions: Transaction[]) => void): () => void {
    // No-op for LocalStorage
    return () => {};
  }
}

export class SupabaseStorageAdapter implements IStorageAdapter {
  private localFallback = new LocalStorageAdapter();

  getStorageMode(): StorageMode {
    return isSupabaseConfigured && supabase ? 'supabase' : 'local';
  }

  async fetchTransactions(): Promise<Transaction[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.localFallback.fetchTransactions();
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase fetch error:', error);
        return this.localFallback.fetchTransactions();
      }

      return (data as DBTransaction[]).map(dbRowToTransaction);
    } catch (err) {
      console.error('Failed to fetch transactions from Supabase:', err);
      return this.localFallback.fetchTransactions();
    }
  }

  async addTransaction(txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    if (!isSupabaseConfigured || !supabase) {
      return this.localFallback.addTransaction(txData);
    }

    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };

    try {
      const dbRow = transactionToDbRow(newTx);
      const { error } = await supabase.from('transactions').insert([dbRow]);

      if (error) {
        console.error('Supabase insert error:', error);
        return this.localFallback.addTransaction(txData);
      }

      return newTx;
    } catch (err) {
      console.error('Failed to add transaction to Supabase:', err);
      return this.localFallback.addTransaction(txData);
    }
  }

  async updateTransaction(updatedTx: Transaction): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return this.localFallback.updateTransaction(updatedTx);
    }

    try {
      const dbRow = transactionToDbRow(updatedTx);
      const { error } = await supabase
        .from('transactions')
        .update(dbRow)
        .eq('id', updatedTx.id);

      if (error) {
        console.error('Supabase update error:', error);
        await this.localFallback.updateTransaction(updatedTx);
      }
    } catch (err) {
      console.error('Failed to update transaction in Supabase:', err);
      await this.localFallback.updateTransaction(updatedTx);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return this.localFallback.deleteTransaction(id);
    }

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        await this.localFallback.deleteTransaction(id);
      }
    } catch (err) {
      console.error('Failed to delete transaction in Supabase:', err);
      await this.localFallback.deleteTransaction(id);
    }
  }

  async resetToSeed(): Promise<Transaction[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.localFallback.resetToSeed();
    }

    try {
      const { error } = await supabase.from('transactions').delete().neq('id', '');
      if (error) console.error('Supabase reset error:', error);
    } catch (err) {
      console.error('Failed to reset Supabase transactions:', err);
    }
    return [];
  }

  async clearAll(): Promise<Transaction[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.localFallback.clearAll();
    }

    try {
      const { error } = await supabase.from('transactions').delete().neq('id', '');
      if (error) console.error('Supabase clearAll error:', error);
    } catch (err) {
      console.error('Failed to clear Supabase transactions:', err);
    }
    return [];
  }

  subscribeToTransactions(onUpdate: (transactions: Transaction[]) => void): () => void {
    if (!isSupabaseConfigured || !supabase) {
      return () => {};
    }

    const client = supabase;

    const channel = client
      .channel('public:transactions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        async () => {
          const fresh = await this.fetchTransactions();
          onUpdate(fresh);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }
}

export const storageAdapter: IStorageAdapter = new SupabaseStorageAdapter();
