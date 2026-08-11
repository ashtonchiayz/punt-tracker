export type Member = 'Sidd' | 'Chia' | 'Yh' | 'Cy';

export const MEMBERS: Member[] = ['Sidd', 'Chia', 'Yh', 'Cy'];

export const MEMBER_INFO: Record<Member, { name: string; avatar: string; color: string; bgLight: string }> = {
  Sidd: { name: 'Sidd', avatar: '♠️', color: '#6366f1', bgLight: 'rgba(99, 102, 241, 0.15)' },
  Chia: { name: 'Chia', avatar: '♣️', color: '#10b981', bgLight: 'rgba(16, 185, 129, 0.15)' },
  Yh:   { name: 'Yh',   avatar: '♦️', color: '#f59e0b', bgLight: 'rgba(245, 158, 11, 0.15)' },
  Cy:   { name: 'Cy',   avatar: '♥️', color: '#ec4899', bgLight: 'rgba(236, 72, 153, 0.15)' },
};

export type Currency = 'r' | 'arb' | 'rr';

export const CURRENCIES: { id: Currency; label: string; shortLabel: string; symbol: string; description: string }[] = [
  { id: 'r', label: 'Real (r)', shortLabel: 'Real', symbol: 'r', description: 'Standard monetary currency' },
  { id: 'arb', label: 'Arbitrary (arb)', shortLabel: 'Arbitrary', symbol: 'arb', description: 'Arbitrary points & IOUs' },
  { id: 'rr', label: 'Real Real (rr)', shortLabel: 'Real Real', symbol: 'rr', description: 'Strict real cash settlements' },
];

export type CategoryTag = 'Food' | 'Activity' | 'Transport' | 'Bet' | 'Misc' | 'Settlement';

export const CATEGORIES: { id: CategoryTag; label: string; icon: string; color: string }[] = [
  { id: 'Food', label: 'Food & Drinks', icon: '🍕', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'Activity', label: 'Activity & Fitness', icon: '🚴', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'Transport', label: 'Transport', icon: '🚗', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'Bet', label: 'Bet / Wager', icon: '🎲', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { id: 'Misc', label: 'Misc & Shopping', icon: '🛍️', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'Settlement', label: 'Debt Settle-Up', icon: '🤝', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
];

export type SplitMode = 'equal' | 'exact';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  currency: Currency;
  paidBy: Member;
  splitMode: SplitMode;
  owers: Member[]; // List of members who share cost
  exactSplits?: Partial<Record<Member, number>>; // Exact amounts per ower if splitMode is 'exact'
  category: CategoryTag;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO string timestamp
  isSettlement?: boolean;
  status?: 'pending' | 'completed';
}

export interface MemberBalance {
  member: Member;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // totalPaid - totalOwed
}

export interface DirectDebt {
  debtor: Member;
  creditor: Member;
  amount: number;
  currency: Currency;
}

export interface SimplifiedTransfer {
  from: Member;
  to: Member;
  amount: number;
  currency: Currency;
}

// 4x4 matrix representation [debtor][creditor] = amount owed
export type DebtMatrix = Record<Member, Record<Member, number>>;
