import { useEffect, useRef, useState } from 'react';
import { Shuffle } from 'lucide-react';

interface Props {
  items: string[];
  duration: number;
  effectsEnabled: boolean;
  soundEnabled: boolean;
  numResults: number;
  onResult: (selected: string[]) => void;
  onTick: () => void;
  onFanfare: () => void;
  onInvalidRequest: (message: string) => void;
  remainingItems: string[];
  excludedItems: string[];
}

export default function ButtonView({
  items, duration, effectsEnabled, soundEnabled, numResults, onResult, onTick, onFanfare, onInvalidRequest, remainingItems, excludedItems,
}: Props) {
  const [spinning, setSpinning] = useState(false);
  const [displayValues, setDisplayValues] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pool = remainingItems;
  const selectablePool = pool.filter((item) => !excludedItems.includes(item));

  const handlePick = () => {
    if (spinning || selectablePool.length === 0) return;
    if (selectablePool.length < numResults) {
      onInvalidRequest(`Danh sách chỉ còn ${selectablePool.length} phần tử khả dụng, nhưng bạn đang yêu cầu chọn ${numResults}. Hãy giảm số cần chọn hoặc tắt "Xóa tên/số đã chọn" để khôi phục danh sách.`);
      return;
    }
    setSpinning(true);
    setShowResult(false);

    // Pre-select results from the actual draw pool, while keeping excluded names visible on the wheel/list
    const tempPool = [...selectablePool];
    const results: string[] = [];
    const count = Math.min(numResults, tempPool.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * tempPool.length);
      results.push(tempPool[idx]);
      tempPool.splice(idx, 1);
    }

    const finish = () => {
      setDisplayValues(results);
      setSpinning(false);
      setShowResult(true);
      setSelected(results);
      if (soundEnabled) onFanfare();
      onResult(results);
    };

    if (effectsEnabled) {
      const startTime = Date.now();
      const durationMs = duration * 1000;
      const displayCount = Math.max(numResults, 1);

      const tick = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= durationMs) {
          finish();
          return;
        }
        const progress = elapsed / durationMs;
        setDisplayValues(
          Array.from({ length: displayCount }, () => selectablePool[Math.floor(Math.random() * selectablePool.length)])
        );
        if (soundEnabled) onTick();
        // Slow down toward the end
        const delay = 50 + Math.pow(progress, 3) * 300;
        timeoutRef.current = setTimeout(tick, delay);
      };

      setDisplayValues(
        Array.from({ length: displayCount }, () => selectablePool[Math.floor(Math.random() * selectablePool.length)])
      );
      timeoutRef.current = setTimeout(tick, 50);
    } else {
      setSelected(results);
      setDisplayValues(results);
      setShowResult(true);
      if (soundEnabled) onFanfare();
      onResult(results);
    }
  };

  const showValues = spinning ? displayValues : selected;
  const isResult = showResult && !spinning;

  const getResultFontSize = (count: number, label: string) => {
    const length = label.length;
    if (count <= 2) return 'clamp(1.6rem, 4vw, 4rem)';
    if (count <= 4) return length > 12 ? 'clamp(1rem, 2.8vw, 1.6rem)' : 'clamp(1.2rem, 3vw, 2.2rem)';
    if (count <= 8) return length > 12 ? 'clamp(0.9rem, 2vw, 1.3rem)' : 'clamp(1rem, 2.2vw, 1.6rem)';
    return length > 14 ? 'clamp(0.72rem, 1.6vw, 1rem)' : 'clamp(0.8rem, 1.8vw, 1.2rem)';
  };

  useEffect(() => {
    if (!showResult) return;

    const handleKeyDown = () => {
      setShowResult(false);
      setSelected([]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult]);

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-start gap-6 py-2 pt-0">
      {/* Result overlay */}
      {isResult && selected.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease]" onClick={() => setShowResult(false)}>
          <div className="max-h-[calc(100vh-2rem)] w-[min(90vw,760px)] overflow-y-auto rounded-[32px] border border-amber-300/70 bg-gradient-to-br from-amber-500/20 via-yellow-400/10 to-orange-500/15 p-6 shadow-[0_0_50px_rgba(251,191,36,0.18)] backdrop-blur-md sm:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">Kết quả</p>
              <div
                className="grid w-full max-w-[680px] gap-3 px-1"
                style={{
                  gridTemplateColumns: selected.length > 6 ? 'repeat(auto-fit, minmax(120px, 1fr))' : selected.length > 3 ? 'repeat(auto-fit, minmax(150px, 1fr))' : 'repeat(auto-fit, minmax(170px, 1fr))',
                  alignItems: 'stretch',
                }}
              >
                {selected.map((name, i) => (
                  <div
                    key={i}
                    className="animate-[popIn_0.5s_ease] flex items-center justify-center rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-500/20 to-orange-500/20 px-3 py-3 font-bold text-white shadow-lg shadow-amber-500/20"
                    style={{
                      fontSize: getResultFontSize(selected.length, name),
                      textShadow: '0 0 30px rgba(245,158,11,0.6), 0 0 60px rgba(245,158,11,0.3)',
                      animationDelay: `${i * 0.08}s`,
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: 1.2,
                    }}
                  >
                    {name}
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-slate-200">Bấm vào màn hình hoặc nhấn phím bất kỳ để đóng</p>
            </div>
          </div>
        </div>
      )}

      {/* Display area */}
      {pool.length > 0 ? (
        <div
          className="flex flex-wrap items-center justify-center gap-4 min-h-[200px]"
          style={{
            fontSize: showValues.length === 1 ? 'clamp(2rem, 6vw, 3.5rem)' : 'clamp(1.5rem, 4vw, 2.5rem)',
          }}
        >
          {showValues.length === 0 ? (
            <p className="text-slate-500 text-xl">Bấm nút để bắt đầu random!</p>
          ) : (
            showValues.map((val, i) => (
              <div
                key={i}
                className={`rounded-2xl px-6 py-3 font-bold transition-all ${
                  spinning
                    ? 'bg-white/5 text-slate-300 scale-95'
                    : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-white scale-100 border border-amber-400/30'
                }`}
                style={{
                  textShadow: spinning ? 'none' : '0 0 20px rgba(245,158,11,0.4)',
                }}
              >
                {val}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">Chưa có danh sách nào được chọn</p>
          <p className="text-sm mt-2">Hãy tạo và chọn một danh sách ở tab "Danh sách"</p>
        </div>
      )}

      {/* Pick button */}
      <button
        onClick={handlePick}
        disabled={spinning || selectablePool.length === 0}
        className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-12 py-5 text-xl font-bold text-slate-900 shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
      >
        <Shuffle size={28} className={spinning ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'} />
        {spinning ? 'Đang chọn...' : 'RANDOM'}
      </button>
    </div>
  );
}
