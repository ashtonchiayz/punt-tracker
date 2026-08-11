import { Transaction } from './types';
import { supabase } from './supabase';

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
  status?: string;
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
    status: (row.status as any) || 'completed',
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
    status: tx.status || 'completed',
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

  saveSync(txs: Transaction[]): void {
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
    return () => {};
  }
}

export class SupabaseStorageAdapter implements IStorageAdapter {
  private localFallback = new LocalStorageAdapter();
  private isMigrated = false;

  getStorageMode(): StorageMode {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return 'local';
    }
    return 'supabase';
  }

  /**
   * Migrate any transactions existing in browser localStorage
   * (e.g., from punt-tracker-beta.vercel.app before Supabase setup) to Supabase.
   */
  private async migrateLocalDataIfNeeded(remoteDbIds: Set<string>): Promise<void> {
    if (typeof window === 'undefined' || this.isMigrated) return;

    const keysToScan = [
      'punt_tracker_transactions_v4',
      'punt_tracker_transactions_v3',
      'punt_tracker_transactions_v2',
      'punt_tracker_transactions',
    ];

    const unmigrated: Transaction[] = [];

    for (const key of keysToScan) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed: Transaction[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.id && !remoteDbIds.has(item.id)) {
              unmigrated.push(item);
              remoteDbIds.add(item.id);
            }
          }
        }
      } catch (e) {
        console.error(`Error parsing local storage key ${key}:`, e);
      }
    }

    if (unmigrated.length > 0) {
      console.log(`Migrating ${unmigrated.length} local transactions to Supabase...`);
      const rows = unmigrated.map(transactionToDbRow);
      const { error } = await supabase.from('transactions').upsert(rows);
      if (error) {
        console.error('Failed to migrate local transactions to Supabase:', error);
      } else {
        console.log('Successfully synced local transactions to Supabase!');
      }
    }

    this.isMigrated = true;
  }

  async fetchTransactions(): Promise<Transaction[]> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
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

      const transactions = (data as DBTransaction[]).map(dbRowToTransaction);
      const remoteDbIds = new Set(transactions.map((t) => t.id));

      // Migrate any previously logged local transactions to Supabase
      await this.migrateLocalDataIfNeeded(remoteDbIds);

      // If migration uploaded new items, re-fetch final set from Supabase
      if (remoteDbIds.size > transactions.length) {
        const { data: updatedData } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (updatedData) {
          const finalTxs = (updatedData as DBTransaction[]).map(dbRowToTransaction);
          this.localFallback.saveSync(finalTxs);
          return finalTxs;
        }
      }

      // Keep local cache synced for offline access
      this.localFallback.saveSync(transactions);
      return transactions;
    } catch (err) {
      console.error('Failed to fetch transactions from Supabase:', err);
      return this.localFallback.fetchTransactions();
    }
  }

  async addTransaction(txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const newTx: Transaction = {
      ...txData,
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      createdAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined' && !navigator.onLine) {
      return this.localFallback.addTransaction(txData);
    }

    try {
      const dbRow = transactionToDbRow(newTx);
      const { error } = await supabase.from('transactions').insert([dbRow]);

      if (error) {
        console.error('Supabase insert error, saving locally:', error);
        return this.localFallback.addTransaction(txData);
      }

      // Also update local cache
      const cached = this.localFallback.getTransactionsSync();
      this.localFallback.saveSync([newTx, ...cached.filter((t) => t.id !== newTx.id)]);

      return newTx;
    } catch (err) {
      console.error('Failed to add transaction to Supabase:', err);
      return this.localFallback.addTransaction(txData);
    }
  }

  async updateTransaction(updatedTx: Transaction): Promise<void> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      await this.localFallback.updateTransaction(updatedTx);
      return;
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
        return;
      }

      await this.localFallback.updateTransaction(updatedTx);
    } catch (err) {
      console.error('Failed to update transaction in Supabase:', err);
      await this.localFallback.updateTransaction(updatedTx);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      await this.localFallback.deleteTransaction(id);
      return;
    }

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        await this.localFallback.deleteTransaction(id);
        return;
      }

      await this.localFallback.deleteTransaction(id);
    } catch (err) {
      console.error('Failed to delete transaction in Supabase:', err);
      await this.localFallback.deleteTransaction(id);
    }
  }

  async resetToSeed(): Promise<Transaction[]> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return this.localFallback.resetToSeed();
    }

    try {
      const { error } = await supabase.from('transactions').delete().neq('id', '');
      if (error) console.error('Supabase reset error:', error);
    } catch (err) {
      console.error('Failed to reset Supabase transactions:', err);
    }
    this.localFallback.saveSync([]);
    return [];
  }

  async clearAll(): Promise<Transaction[]> {
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return this.localFallback.clearAll();
    }

    try {
      const { error } = await supabase.from('transactions').delete().neq('id', '');
      if (error) console.error('Supabase clearAll error:', error);
    } catch (err) {
      console.error('Failed to clear Supabase transactions:', err);
    }
    this.localFallback.saveSync([]);
    return [];
  }

  subscribeToTransactions(onUpdate: (transactions: Transaction[]) => void): () => void {
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

    // Online reconnection listener to auto sync local data when network comes online
    const handleOnline = async () => {
      const fresh = await this.fetchTransactions();
      onUpdate(fresh);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }

    return () => {
      client.removeChannel(channel);
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
    };
  }
}

export const storageAdapter: IStorageAdapter = new SupabaseStorageAdapter();
