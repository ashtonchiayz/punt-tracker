'use client';

import React, { useState } from 'react';
import { Member, MEMBERS, MEMBER_INFO, Currency, Transaction } from '@/lib/types';
import { calculatePairwiseMatrix, formatAmount } from '@/lib/calculations';
import { Grid, Info, CheckCircle2 } from 'lucide-react';

interface PairwiseMatrixProps {
  transactions: Transaction[];
  activeCurrency: Currency | 'all';
  onCellSettle?: (debtor: Member, creditor: Member, amount: number, currency: Currency) => void;
}

const ALL_CURRENCIES: Currency[] = ['r', 'arb', 'rr'];

export const PairwiseMatrix: React.FC<PairwiseMatrixProps> = ({
  transactions,
  activeCurrency,
  onCellSettle,
}) => {
  const [matrixMode, setMatrixMode] = useState<'direct' | 'net'>('direct');
  const [hoveredCell, setHoveredCell] = useState<{ row: Member; col: Member } | null>(null);

  // Computes debt entries per currency for cell (row, col)
  const getCellDebts = (row: Member, col: Member): { amount: number; currency: Currency }[] => {
    if (row === col) return [];

    const currenciesToCalc: Currency[] =
      activeCurrency === 'all' ? ALL_CURRENCIES : [activeCurrency];

    const results: { amount: number; currency: Currency }[] = [];

    currenciesToCalc.forEach((curr) => {
      const matrix = calculatePairwiseMatrix(transactions, curr);
      let val = 0;
      if (matrixMode === 'direct') {
        val = matrix[row][col];
      } else {
        const rowOwesCol = matrix[row][col];
        const colOwesRow = matrix[col][row];
        val = Math.max(0, rowOwesCol - colOwesRow);
      }
      if (val > 0.009) {
        results.push({ amount: val, currency: curr });
      }
    });

    return results;
  };

  const handleCellClick = (row: Member, col: Member) => {
    if (row === col || !onCellSettle) return;
    const debts = getCellDebts(row, col);
    if (debts.length > 0) {
      // Pick the first currency debt item to settle
      onCellSettle(row, col, debts[0].amount, debts[0].currency);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 p-4 sm:p-6 border border-white/10 backdrop-blur-xl shadow-sm overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Grid className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Pairwise Debt Matrix
            </h2>
            <p className="text-xs text-zinc-400">
              Interactive ledger grid • Row person owes Column person (Click cell to settle)
            </p>
          </div>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center bg-black p-1 rounded-full border border-white/10 text-xs shrink-0">
          <button
            onClick={() => setMatrixMode('direct')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all min-h-[36px] ${
              matrixMode === 'direct'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Direct Total
          </button>
          <button
            onClick={() => setMatrixMode('net')}
            className={`px-3 py-1.5 rounded-full font-semibold transition-all min-h-[36px] ${
              matrixMode === 'net'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Net Bilateral
          </button>
        </div>
      </div>

      {/* Grid Container - Horizontally scrollable on mobile */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <table className="w-full border-collapse min-w-[520px]">
          <thead>
            <tr>
              <th className="p-3 text-left bg-black rounded-tl-xl border border-zinc-800 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Debtor ➔ Creditor
              </th>
              {MEMBERS.map((colMember) => {
                const info = MEMBER_INFO[colMember];
                return (
                  <th
                    key={colMember}
                    className="p-3 text-center bg-black border border-zinc-800 text-xs font-bold text-zinc-200"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{info.avatar}</span>
                      <span>{info.name}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {MEMBERS.map((rowMember) => {
              const rowInfo = MEMBER_INFO[rowMember];
              return (
                <tr key={rowMember} className="transition-colors hover:bg-zinc-800/30">
                  {/* Row Header */}
                  <th className="p-3 text-left bg-black/60 border border-zinc-800 text-xs font-semibold text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      <span>{rowInfo.avatar}</span>
                      <span className="font-bold text-white">{rowInfo.name}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">owes</span>
                    </div>
                  </th>

                  {/* Matrix Cells */}
                  {MEMBERS.map((colMember) => {
                    const isDiagonal = rowMember === colMember;
                    const debts = getCellDebts(rowMember, colMember);
                    const hasValue = debts.length > 0;
                    const isHovered =
                      hoveredCell?.row === rowMember && hoveredCell?.col === colMember;

                    return (
                      <td
                        key={colMember}
                        onMouseEnter={() => setHoveredCell({ row: rowMember, col: colMember })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => handleCellClick(rowMember, colMember)}
                        title={hasValue ? 'Click to settle debt directly' : undefined}
                        className={`p-3 text-center border border-zinc-800 transition-all font-mono text-xs ${
                          isDiagonal
                            ? 'bg-black/80 text-zinc-700 select-none'
                            : isHovered
                            ? 'bg-blue-500/20 border-blue-500/50 shadow-inner cursor-pointer'
                            : hasValue
                            ? 'bg-rose-500/10 text-rose-400 font-bold hover:bg-rose-500/20 cursor-pointer'
                            : 'bg-black/30 text-zinc-600'
                        }`}
                      >
                        {isDiagonal ? (
                          <span className="text-zinc-800">—</span>
                        ) : hasValue ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {debts.map((item, idx) => (
                              <span key={idx} className="block text-xs font-bold font-mono">
                                {formatAmount(item.amount, item.currency)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="opacity-30">0</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Explainer Footer */}
      <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 flex items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-400 shrink-0" />
          {hoveredCell && hoveredCell.row !== hoveredCell.col ? (
            <div>
              <span className="font-semibold text-white">
                {MEMBER_INFO[hoveredCell.row].name}
              </span>{' '}
              owes{' '}
              <span className="font-semibold text-white">
                {MEMBER_INFO[hoveredCell.col].name}
              </span>{' '}
              :{' '}
              {getCellDebts(hoveredCell.row, hoveredCell.col).length > 0 ? (
                <span className="font-mono font-bold text-rose-400 ml-1">
                  {getCellDebts(hoveredCell.row, hoveredCell.col)
                    .map((d) => formatAmount(d.amount, d.currency))
                    .join(', ')}
                </span>
              ) : (
                <span className="font-mono text-zinc-400 ml-1">0</span>
              )}
            </div>
          ) : (
            <span>Tap any active debt cell to bring up the Settlement Modal</span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Click to Settle</span>
        </div>
      </div>
    </div>
  );
};
