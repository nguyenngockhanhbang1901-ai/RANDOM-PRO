import { History, Trash2, Clock } from 'lucide-react';
import type { RandomResult, GroupResult } from '@/types';

interface Props {
  history: (RandomResult | GroupResult)[];
  onClear: () => void;
}

function isGroupResult(r: RandomResult | GroupResult): r is GroupResult {
  return 'groups' in r;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const MM = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}/${MM} ${hh}:${mm}`;
}

export default function HistoryPanel({ history, onClear }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-200">
          <History size={20} className="text-amber-400" />
          Lịch sử random
        </h3>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} /> Xóa tất cả
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <Clock size={48} className="mx-auto mb-3 opacity-50" />
          <p>Chưa có lịch sử nào</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {history.slice().reverse().map((entry) => (
            <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-amber-400/15 px-2.5 py-1 text-xs font-medium text-amber-300">
                    {isGroupResult(entry) ? `Chia ${entry.numGroups} nhóm` : 'Random'}
                  </span>
                  <span className="text-sm text-slate-400">{entry.listName}</span>
                </div>
                <span className="text-xs text-slate-500">{formatTime(entry.timestamp)}</span>
              </div>
              {isGroupResult(entry) ? (
                <div className="flex flex-wrap gap-2">
                  {entry.groups.map((group, i) => (
                    <div key={i} className="rounded-lg bg-slate-800/60 px-3 py-1.5">
                      <span className="text-xs font-semibold text-amber-400">Nhóm {i + 1}: </span>
                      <span className="text-sm text-slate-300">{group.join(', ')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {entry.selected.map((name, i) => (
                    <span key={i} className="rounded-lg bg-slate-800/60 px-3 py-1.5 text-sm font-medium text-slate-200">
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
