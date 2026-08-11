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
  bettor?: string;
  opponent?: string;
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
    status: (row.status as any) === 'pending' ? 'pending' : 'completed',
    bettor: (row.bettor as any) || undefined,
    opponent: (row.opponent as any) || undefined,
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
    bettor: tx.bettor || undefined,
    opponent: tx.opponent || undefined,
  };
}

export interface IStorageAdapter {
  getStorageMode(): StorageMode;
  fetchTransactions(): Promise<Transaction[]>;
  addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  updateTransaction(updatedTx: Transaction): Promise<void>;
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
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  saveSync(transactions: Transaction[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  async fetchTransactions(): Promise<Transaction[]> {
    return this.getTransactionsSync();
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
    } else {
      this.saveSync([updatedTx, ...list]);
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
      const rows = unmigrated.map(transactionToDbRow);
      await supabase.from('transactions').upsert(rows);
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

      const remoteTransactions = (data as DBTransaction[]).map(dbRowToTransaction);
      const remoteDbIds = new Set(remoteTransactions.map((t) => t.id));

      await this.migrateLocalDataIfNeeded(remoteDbIds);

      // Merge local cached transactions with remote transactions so locally logged pending bets or offline entries are NEVER lost
      const localCached = this.localFallback.getTransactionsSync();
      const mergedMap = new Map<string, Transaction>();

      // Remote DB takes priority for existing IDs
      remoteTransactions.forEach((t) => mergedMap.set(t.id, t));

      // Preserve any local entries not yet in remote DB
      localCached.forEach((t) => {
        if (!mergedMap.has(t.id)) {
          mergedMap.set(t.id, t);
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      this.localFallback.saveSync(mergedList);
      return mergedList;
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

    // Always update local cache immediately for instant UI reflection
    const cached = this.localFallback.getTransactionsSync();
    this.localFallback.saveSync([newTx, ...cached.filter((t) => t.id !== newTx.id)]);

    if (typeof window !== 'undefined' && !navigator.onLine) {
      return newTx;
    }

    try {
      const dbRow = transactionToDbRow(newTx);
      const { error } = await supabase.from('transactions').insert([dbRow]);

      if (error) {
        console.error('Supabase insert error, saved locally:', error);
      }

      return newTx;
    } catch (err) {
      console.error('Failed to add transaction to Supabase:', err);
      return newTx;
    }
  }

  async updateTransaction(updatedTx: Transaction): Promise<void> {
    // Instantly update local cache
    await this.localFallback.updateTransaction(updatedTx);

    if (typeof window !== 'undefined' && !navigator.onLine) {
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
      }
    } catch (err) {
      console.error('Failed to update transaction in Supabase:', err);
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.localFallback.deleteTransaction(id);

    if (typeof window !== 'undefined' && !navigator.onLine) {
      return;
    }

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) {
        console.error('Supabase delete error:', error);
      }
    } catch (err) {
      console.error('Failed to delete transaction in Supabase:', err);
    }
  }

  async resetToSeed(): Promise<Transaction[]> {
    this.localFallback.saveSync([]);
    try {
      await supabase.from('transactions').delete().neq('id', 'dummy');
    } catch (e) {
      console.error('Error clearing Supabase:', e);
    }
    return [];
  }

  async clearAll(): Promise<Transaction[]> {
    this.localFallback.saveSync([]);
    try {
      await supabase.from('transactions').delete().neq('id', 'dummy');
    } catch (e) {
      console.error('Error clearing Supabase:', e);
    }
    return [];
  }

  subscribeToTransactions(onUpdate: (transactions: Transaction[]) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const channel = supabase
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
      supabase.removeChannel(channel);
    };
  }
}

export const storageAdapter: IStorageAdapter = new SupabaseStorageAdapter();
