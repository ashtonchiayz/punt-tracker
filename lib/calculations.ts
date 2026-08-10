import {
  Member,
  MEMBERS,
  Currency,
  Transaction,
  MemberBalance,
  DebtMatrix,
  SimplifiedTransfer,
} from './types';

/**
 * Calculates share owed per member for a given transaction
 */
export function getSharesForTransaction(tx: Transaction): Record<Member, number> {
  const shares: Record<Member, number> = { Sidd: 0, Chia: 0, Yh: 0, Cy: 0 };

  if (!tx.owers || tx.owers.length === 0) return shares;

  if (tx.splitMode === 'exact' && tx.exactSplits) {
    MEMBERS.forEach((m) => {
      shares[m] = tx.exactSplits?.[m] || 0;
    });
  } else {
    // Equal split among all owers
    const sharePerOwer = tx.amount / tx.owers.length;
    tx.owers.forEach((ower) => {
      shares[ower] = sharePerOwer;
    });
  }

  return shares;
}

/**
 * Calculates net balances per member for a given currency (or all currencies combined if activeCurrency is undefined/'all')
 */
export function calculateNetBalances(
  transactions: Transaction[],
  currencyFilter?: Currency | 'all'
): Record<Member, MemberBalance> {
  const filtered =
    !currencyFilter || currencyFilter === 'all'
      ? transactions
      : transactions.filter((t) => t.currency === currencyFilter);

  const result: Record<Member, MemberBalance> = {
    Sidd: { member: 'Sidd', totalPaid: 0, totalOwed: 0, netBalance: 0 },
    Chia: { member: 'Chia', totalPaid: 0, totalOwed: 0, netBalance: 0 },
    Yh:   { member: 'Yh',   totalPaid: 0, totalOwed: 0, netBalance: 0 },
    Cy:   { member: 'Cy',   totalPaid: 0, totalOwed: 0, netBalance: 0 },
  };

  filtered.forEach((tx) => {
    // Payer gets credit
    if (result[tx.paidBy]) {
      result[tx.paidBy].totalPaid += tx.amount;
    }

    // Owers accumulate debt
    const shares = getSharesForTransaction(tx);
    MEMBERS.forEach((m) => {
      result[m].totalOwed += shares[m];
    });
  });

  MEMBERS.forEach((m) => {
    result[m].netBalance = result[m].totalPaid - result[m].totalOwed;
  });

  return result;
}

/**
 * Computes direct pairwise debt matrix [debtor][creditor]
 * Matrix cell (Row, Col) = amount Row owes Column directly.
 */
export function calculatePairwiseMatrix(
  transactions: Transaction[],
  currencyFilter?: Currency | 'all'
): DebtMatrix {
  const matrix: DebtMatrix = {
    Sidd: { Sidd: 0, Chia: 0, Yh: 0, Cy: 0 },
    Chia: { Sidd: 0, Chia: 0, Yh: 0, Cy: 0 },
    Yh:   { Sidd: 0, Chia: 0, Yh: 0, Cy: 0 },
    Cy:   { Sidd: 0, Chia: 0, Yh: 0, Cy: 0 },
  };

  const filtered =
    !currencyFilter || currencyFilter === 'all'
      ? transactions
      : transactions.filter((t) => t.currency === currencyFilter);

  filtered.forEach((tx) => {
    const payer = tx.paidBy;
    const shares = getSharesForTransaction(tx);

    MEMBERS.forEach((ower) => {
      if (ower !== payer) {
        // ower owes payer their share
        matrix[ower][payer] += shares[ower];
      }
    });
  });

  return matrix;
}

/**
 * Greedy algorithm to simplify group debts into minimum number of direct transfers
 */
export function simplifyDebts(
  transactions: Transaction[],
  currencyFilter: Currency
): SimplifiedTransfer[] {
  const balances = calculateNetBalances(transactions, currencyFilter);

  // Extract debtors and creditors
  const debtors: { member: Member; balance: number }[] = [];
  const creditors: { member: Member; balance: number }[] = [];

  MEMBERS.forEach((m) => {
    const bal = Math.round(balances[m].netBalance * 100) / 100;
    if (bal < -0.009) {
      debtors.push({ member: m, balance: Math.abs(bal) });
    } else if (bal > 0.009) {
      creditors.push({ member: m, balance: bal });
    }
  });

  // Sort debtors descending by debt amount, creditors descending by credit amount
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const transfers: SimplifiedTransfer[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.balance, creditor.balance);
    const roundedAmount = Math.round(amount * 100) / 100;

    if (roundedAmount > 0) {
      transfers.push({
        from: debtor.member,
        to: creditor.member,
        amount: roundedAmount,
        currency: currencyFilter,
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance <= 0.009) {
      i++;
    }
    if (creditor.balance <= 0.009) {
      j++;
    }
  }

  return transfers;
}

/**
 * Utility to format amount cleanly with currency symbol/code
 */
export function formatAmount(amount: number, currency: Currency): string {
  const rounded = Math.round(amount * 100) / 100;
  const numStr = rounded.toLocaleString('en-US', {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  switch (currency) {
    case 'r':
      return `$${numStr} r`;
    case 'arb':
      return `${numStr} arb`;
    case 'rr':
      return `$${numStr} rr`;
    case 'rr*':
      return `$${numStr} rr*`;
    default:
      return `${numStr} ${currency}`;
  }
}
