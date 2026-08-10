'use client';

import React, { useState } from 'react';
import { Member, MEMBERS, MEMBER_INFO, Currency, Transaction } from '@/lib/types';
import { calculatePairwiseMatrix, formatAmount } from '@/lib/calculations';
import { Grid, Info } from 'lucide-react';

interface PairwiseMatrixProps {
  transactions: Transaction[];
  activeCurrency: Currency | 'all';
}

const ALL_CURRENCIES: Currency[] = ['r', 'arb', 'rr', 'rr*'];

export const PairwiseMatrix: React.FC<PairwiseMatrixProps> = ({ transactions, activeCurrency }) => {
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

  return (
    <div className="rounded-2xl bg-slate-900/60 p-6 border border-slate-800/80 backdrop-blur-xl shadow-xl overflow-hidden">
      {/* Matrix Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Grid className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Pairwise Debt Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Interactive ledger grid • Row person owes Column person
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs">
          <button
            onClick={() => setMatrixMode('direct')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              matrixMode === 'direct'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Direct Total
          </button>
          <button
            onClick={() => setMatrixMode('net')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              matrixMode === 'net'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Net Bilateral
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto pb-2">
        <table className="w-full border-collapse min-w-[540px]">
          <thead>
            <tr>
              <th className="p-3 text-left bg-slate-950/80 rounded-tl-xl border border-slate-800/80 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span>Debtor ➔ Creditor</span>
                </div>
              </th>
              {MEMBERS.map((colMember) => {
                const info = MEMBER_INFO[colMember];
                return (
                  <th
                    key={colMember}
                    className="p-3 text-center bg-slate-950/80 border border-slate-800/80 text-xs font-bold text-slate-200"
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
                <tr key={rowMember} className="transition-colors hover:bg-slate-800/20">
                  {/* Row Header */}
                  <th className="p-3 text-left bg-slate-950/60 border border-slate-800/80 text-xs font-semibold text-slate-200">
                    <div className="flex items-center gap-2">
                      <span>{rowInfo.avatar}</span>
                      <span className="font-bold text-slate-100">{rowInfo.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">owes</span>
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
                        className={`p-3.5 text-center border border-slate-800/80 transition-all font-mono text-sm ${
                          isDiagonal
                            ? 'bg-slate-950/90 text-slate-700 select-none'
                            : isHovered
                            ? 'bg-purple-500/20 border-purple-500/50 shadow-inner'
                            : hasValue
                            ? 'bg-slate-900/90 text-rose-300 font-semibold'
                            : 'bg-slate-950/30 text-slate-600'
                        }`}
                      >
                        {isDiagonal ? (
                          <span className="text-slate-800">—</span>
                        ) : hasValue ? (
                          <div className="flex flex-col items-center gap-1">
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

      {/* Hover Cell Explainer Banner */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-purple-400 shrink-0" />
          {hoveredCell && hoveredCell.row !== hoveredCell.col ? (
            <div>
              <span className="font-semibold text-slate-200">
                {MEMBER_INFO[hoveredCell.row].name}
              </span>{' '}
              owes{' '}
              <span className="font-semibold text-slate-200">
                {MEMBER_INFO[hoveredCell.col].name}
              </span>{' '}
              :{' '}
              {getCellDebts(hoveredCell.row, hoveredCell.col).length > 0 ? (
                <span className="font-mono font-bold text-rose-300 ml-1">
                  {getCellDebts(hoveredCell.row, hoveredCell.col)
                    .map((d) => formatAmount(d.amount, d.currency))
                    .join(', ')}
                </span>
              ) : (
                <span className="font-mono text-slate-400 ml-1">0</span>
              )}
              {matrixMode === 'net' && (
                <span className="text-slate-500 text-[11px] ml-1.5">(Net bilateral balance)</span>
              )}
            </div>
          ) : (
            <span>Hover over any matrix cell to highlight exact directional balance</span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block">
          Matrix Format: [Row Owes Column]
        </div>
      </div>
    </div>
  );
};
