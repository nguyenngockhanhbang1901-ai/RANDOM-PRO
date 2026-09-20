import { Search, Check } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
  items: string[];
  excludedItems: string[];
  onToggle: (item: string) => void;
  onClearAll: () => void;
  onSelectAll: () => void;
}

export default function ExclusionPicker({ items, excludedItems, onToggle, onClearAll, onSelectAll }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => items.filter((i) => i.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  );

  const allExcluded = items.length > 0 && excludedItems.length === items.length;

  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-2.5">
      <p className="text-xs text-slate-500">
        Chỉ loại khỏi vòng quay. Những tên được chọn vẫn còn trong danh sách gốc và sẽ không bị xóa khỏi random list. Bỏ chọn để đưa lại vào vòng quay.
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 py-4 text-center">
          Chưa có danh sách nào được chọn.
        </p>
      ) : (
        <>
          {/* Search + actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên..."
                className="w-full rounded-lg bg-slate-800/60 border border-white/10 pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={allExcluded ? onClearAll : onSelectAll}
                className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 transition-all whitespace-nowrap"
              >
                {allExcluded ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
              {excludedItems.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 transition-all whitespace-nowrap"
                >
                  Bỏ lọc
                </button>
              )}
            </div>
          </div>

          {/* Item list */}
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {filtered.map((item) => {
              const isExcluded = excludedItems.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => onToggle(item)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                    isExcluded
                      ? 'bg-red-500/10 border border-red-400/30 text-red-300'
                      : 'bg-slate-800/40 border border-transparent text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <span className={`truncate ${isExcluded ? 'line-through opacity-60' : ''}`}>{item}</span>
                  <span
                    className={`ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                      isExcluded
                        ? 'border-red-400 bg-red-400/20'
                        : 'border-white/20'
                    }`}
                  >
                    {isExcluded && <Check size={14} className="text-red-300" />}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-slate-500 py-4 text-center">Không tìm thấy tên phù hợp.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
