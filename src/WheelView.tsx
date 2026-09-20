import { useEffect, useRef, useState } from 'react';

interface Props {
  items: string[];
  duration: number;
  effectsEnabled: boolean;
  soundEnabled: boolean;
  numResults: number;
  onResult: (selected: string[]) => void;
  onTick: () => void;
  onWhoosh: () => void;
  onFanfare: () => void;
  onInvalidRequest: (message: string) => void;
  remainingItems: string[];
  excludedItems: string[];
}

const COLORS = [
  '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];

export default function WheelView({
  items, duration, effectsEnabled, soundEnabled, numResults, onResult, onTick, onWhoosh, onFanfare, onInvalidRequest, remainingItems, excludedItems,
}: Props) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const tickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wheelItems = remainingItems;
  const selectablePool = wheelItems.filter((item) => !excludedItems.includes(item));
  const segmentAngle = wheelItems.length > 0 ? 360 / wheelItems.length : 360;

  const handleSpin = () => {
    if (spinning || selectablePool.length === 0) return;
    if (selectablePool.length < numResults) {
      onInvalidRequest(`Danh sách chỉ còn ${selectablePool.length} phần tử khả dụng, nhưng bạn đang yêu cầu chọn ${numResults}. Hãy giảm số cần chọn hoặc tắt "Xóa tên/số đã chọn" để khôi phục danh sách.`);
      return;
    }
    setSpinning(true);
    setShowResult(false);
    setSelected([]);

    if (effectsEnabled && soundEnabled) {
      onWhoosh();
    }

    // Pick results from the actual draw pool, while keeping excluded names visible on the wheel
    const pool = [...selectablePool];
    const results: string[] = [];
    const count = Math.min(numResults, pool.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      results.push(pool[idx]);
      pool.splice(idx, 1);
    }

    if (effectsEnabled) {
      const totalSpins = 5 + Math.floor(Math.random() * 3);
      const finalSegment = wheelItems.indexOf(results[0]);
      const pointerAngle = -90;
      const segmentMidpointAngle = (finalSegment + 0.5) * segmentAngle - 90;
      const centerSafetyOffset = Math.min(segmentAngle * 0.08, 2);
      const targetRotation = pointerAngle - segmentMidpointAngle + centerSafetyOffset;
      const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;
      const currentAngle = normalizeAngle(rotation);
      const targetAngle = normalizeAngle(targetRotation);
      const rotationDelta = normalizeAngle(targetAngle - currentAngle);
      const finalRotation = rotation + totalSpins * 360 + rotationDelta;
      setRotation(finalRotation);

      // Tick sounds during spin
      if (soundEnabled) {
        const tickCount = Math.max(1, Math.floor(duration * 8));
        const baseInterval = (duration * 1000) / tickCount;
        const spinStart = performance.now();
        let ticks = 0;
        const scheduleTick = () => {
          if (ticks >= tickCount || performance.now() - spinStart >= duration * 1000) {
            return;
          }
          onTick();
          ticks++;
          const progress = Math.min((performance.now() - spinStart) / (duration * 1000), 1);
          const slowdown = 1 + 3 * progress * progress;
          tickTimeoutRef.current = setTimeout(scheduleTick, baseInterval * slowdown);
        };
        scheduleTick();
      }

      setTimeout(() => {
        setSpinning(false);
        setSelected(results);
        setShowResult(true);
        if (soundEnabled) onFanfare();
        onResult(results);
      }, duration * 1000 + 80);
    } else {
      // No effects: instant result
      setTimeout(() => {
        setSelected(results);
        setShowResult(true);
        if (soundEnabled) onFanfare();
        onResult(results);
      }, 200);
    }
  };

  useEffect(() => {
    if (!showResult) return;

    const handleKeyDown = () => {
      setShowResult(false);
      setSelected([]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);
    };
  }, [showResult]);

  // Build wheel SVG
  const radius = 180;
  const center = 200;
  const segments = wheelItems.map((item, i) => {
    const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
    const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArc = segmentAngle > 180 ? 1 : 0;
    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const midAngle = ((i + 0.5) * segmentAngle - 90) * (Math.PI / 180);
    const textRadius = radius * 0.65;
    const tx = center + textRadius * Math.cos(midAngle);
    const ty = center + textRadius * Math.sin(midAngle);
    const maxTextLength = radius - 72;
    const fontSize = Math.max(8, Math.min(12, maxTextLength / Math.max(item.length * 0.62, 1)));
    const rawRotation = (i + 0.5) * segmentAngle - 90;
    const textRotation = rawRotation > 90 || rawRotation < -90 ? rawRotation + 180 : rawRotation;
    return { path, color: COLORS[i % COLORS.length], tx, ty, textRotation, fontSize, item };
  });

  const getResultFontSize = (count: number, label: string) => {
    const length = label.length;
    if (count <= 2) return 'clamp(1.6rem, 4vw, 4rem)';
    if (count <= 4) return length > 12 ? 'clamp(1rem, 2.8vw, 1.6rem)' : 'clamp(1.2rem, 3vw, 2.2rem)';
    if (count <= 8) return length > 12 ? 'clamp(0.9rem, 2vw, 1.3rem)' : 'clamp(1rem, 2.2vw, 1.6rem)';
    return length > 14 ? 'clamp(0.72rem, 1.6vw, 1rem)' : 'clamp(0.8rem, 1.8vw, 1.2rem)';
  };

  return (
    <div className="flex flex-col items-center justify-start gap-4 pt-0 -mt-3">
      {/* Result overlay */}
      {showResult && selected.length > 0 && (
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

      {/* Wheel */}
      {wheelItems.length > 0 ? (
        <div className="relative">
          {/* Pointer */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10">
            <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[28px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-lg" />
          </div>

          <svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            className="h-auto w-[min(92vw,520px)] max-w-full drop-shadow-2xl"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: `transform ${duration}s cubic-bezier(0.17, 0.67, 0.12, 0.99)`,
            }}
          >
            {segments.map((seg, i) => (
              <g key={i}>
                <path d={seg.path} fill={seg.color} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                <text
                  x={seg.tx}
                  y={seg.ty}
                  fill="white"
                  fontSize={seg.fontSize}
                  fontFamily="'Times New Roman', Times, serif"
                  fontWeight="700"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${seg.textRotation}, ${seg.tx}, ${seg.ty})`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {seg.item}
                </text>
              </g>
            ))}
            <circle cx={center} cy={center} r="30" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />
          </svg>

          <button
            onClick={handleSpin}
                  disabled={spinning || wheelItems.length === 0}
            className="absolute left-1/2 top-1/2 z-10 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-amber-300 bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-slate-900 shadow-xl shadow-amber-500/40 transition-all hover:scale-105 hover:shadow-amber-500/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className={`text-xl leading-none ${spinning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}>⚙</span>
            <span>{spinning ? 'ĐANG QUAY' : 'QUAY'}</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">Chưa có danh sách nào được chọn</p>
          <p className="text-sm mt-2">Hãy tạo và chọn một danh sách ở tab "Danh sách"</p>
        </div>
      )}

    </div>
  );
}
