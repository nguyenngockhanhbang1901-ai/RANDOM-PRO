import { useState } from 'react';
import { Users, Shuffle, Play } from 'lucide-react';

interface Props {
  items: string[];
  onSplit: (numGroups: number) => void;
  soundEnabled: boolean;
  effectsEnabled: boolean;
  onTick: () => void;
  onFanfare: () => void;
}

export default function GroupSplitter({ items, onSplit, soundEnabled, effectsEnabled, onTick, onFanfare }: Props) {
  const [numGroups, setNumGroups] = useState(2);
  const [groups, setGroups] = useState<string[][] | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [displayGroups, setDisplayGroups] = useState<string[][] | null>(null);

  const handleSplit = () => {
    if (items.length === 0 || numGroups < 1) return;
    setSpinning(true);
    setGroups(null);

    // Actual result
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const result: string[][] = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((item, i) => {
      result[i % numGroups].push(item);
    });

    if (effectsEnabled) {
      const durationMs = 2500;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= durationMs) {
          setGroups(result);
          setDisplayGroups(result);
          setSpinning(false);
          if (soundEnabled) onFanfare();
          onSplit(numGroups);
          return;
        }
        // Show random shuffling
        const tempShuffled = [...items].sort(() => Math.random() - 0.5);
        const tempResult: string[][] = Array.from({ length: numGroups }, () => []);
        tempShuffled.forEach((item, i) => {
          tempResult[i % numGroups].push(item);
        });
        setDisplayGroups(tempResult);
        if (soundEnabled && Math.random() > 0.5) onTick();
        requestAnimationFrame(animate);
      };
      animate();
    } else {
      setGroups(result);
      setDisplayGroups(result);
      setSpinning(false);
      if (soundEnabled) onFanfare();
      onSplit(numGroups);
    }
  };

  const maxGroupSize = displayGroups ? Math.max(...displayGroups.map((g) => g.length)) : 0;
  const showGroups = spinning ? displayGroups : groups;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div>
        <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
          Số lượng nhóm
        </label>
        <input
          type="number"
          value={numGroups}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v >= 1) setNumGroups(v);
          }}
          min={1}
          max={items.length || 1}
          placeholder="Nhập số nhóm..."
          className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-3 text-lg text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
        />
      </div>

      <button
        onClick={handleSplit}
        disabled={spinning || items.length === 0 || numGroups < 1}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
      >
        {spinning ? <Shuffle className="animate-pulse" size={20} /> : <Play size={20} />}
        {spinning ? 'Đang chia...' : 'Chia nhóm'}
      </button>

      {items.length === 0 && (
        <div className="pt-4 text-center text-slate-500">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p>Vui lòng chọn một danh sách trước</p>
        </div>
      )}
    </div>
  );
}
