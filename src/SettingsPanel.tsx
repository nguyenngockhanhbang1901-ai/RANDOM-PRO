import { useEffect, useState } from 'react';
import { Sparkles, Eye, EyeOff, RefreshCw, UserX } from 'lucide-react';
import type { Settings } from '@/types';
import ExclusionPicker from '@/ExclusionPicker';
import InputErrorDialog from '@/InputErrorDialog';

interface Props {
  settings: Settings;
  onChange: (settings: Partial<Settings>) => void;
  items: string[];
  excludedItems: string[];
  onToggleExcluded: (item: string) => void;
  onClearExcluded: () => void;
  onSelectAllExcluded: () => void;
}

export default function SettingsPanel({
  settings, onChange, items, excludedItems, onToggleExcluded, onClearExcluded, onSelectAllExcluded,
}: Props) {
  const randomMode = settings.randomMode ?? 'list';
  const [durationInput, setDurationInput] = useState(String(settings.effectDuration));
  const [numberMaxInput, setNumberMaxInput] = useState(String(settings.numberMax ?? 100));
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    setDurationInput(String(settings.effectDuration));
  }, [settings.effectDuration]);

  useEffect(() => {
    setNumberMaxInput(String(settings.numberMax ?? 100));
  }, [settings.numberMax]);

  const handleDurationChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;

    setDurationInput(value);
    const duration = Number(value);
    if (Number.isInteger(duration) && duration >= 1 && duration <= 20) {
      onChange({ effectDuration: duration });
    }
  };

  const normalizeDuration = () => {
    const duration = Number(durationInput);
    if (!Number.isInteger(duration) || duration < 1 || duration > 20) {
      setInputError('Thời gian hiệu ứng phải là số nguyên từ 1 đến 20 giây. Hãy nhập lại một giá trị trong giới hạn này.');
      setDurationInput(String(settings.effectDuration));
      return;
    }
    setDurationInput(String(duration));
    if (duration !== settings.effectDuration) onChange({ effectDuration: duration });
  };

  return (
    <div className="space-y-4">
      {/* Mode selection */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Nguồn random</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ randomMode: 'list' })}
            className={`rounded-xl border px-3 py-2.5 text-base font-medium transition-all ${randomMode === 'list' ? 'border-amber-400/60 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            Danh sách
          </button>
          <button
            onClick={() => onChange({ randomMode: 'numbers' })}
            className={`rounded-xl border px-3 py-2.5 text-base font-medium transition-all ${randomMode === 'numbers' ? 'border-amber-400/60 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            Số
          </button>
        </div>
      </div>

      {randomMode === 'numbers' && (
        <div className="space-y-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
          <p className="text-xs text-slate-300">Nhập giá trị muốn random, không cần chọn danh sách.</p>
          <label className="block space-y-1 text-xs text-slate-400">
            <span className="block">Random từ 1 đến</span>
            <input
              type="number"
              step={1}
              value={numberMaxInput}
              onChange={(e) => {
                const value = e.target.value;
                if (!/^\d*$/.test(value)) return;
                setNumberMaxInput(value);
                const numberMax = Number(value);
                if (Number.isInteger(numberMax) && numberMax > 0) onChange({ numberMax });
              }}
              onBlur={() => {
                const numberMax = Number(numberMaxInput);
                if (!Number.isInteger(numberMax) || numberMax < 1) {
                  setInputError('Giá trị số phải là số nguyên dương lớn hơn 0. Hãy nhập ví dụ như 10, 50 hoặc 100.');
                  setNumberMaxInput(String(settings.numberMax ?? 100));
                  return;
                }
                setNumberMaxInput(String(numberMax));
                if (numberMax !== settings.numberMax) onChange({ numberMax });
              }}
              className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-1.5 text-sm text-slate-100 focus:border-amber-400/50 focus:outline-none"
            />
          </label>
          <p className="text-xs text-slate-500">Chỉ nhập số nguyên dương. Có thể xóa số mặc định và nhập lại.</p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Chế độ hiển thị</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({ mode: 'wheel' })}
              className={`rounded-xl border px-3 py-2.5 text-base font-medium transition-all ${
              settings.mode === 'wheel'
                ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            🎡 Vòng quay
          </button>
          <button
            onClick={() => onChange({ mode: 'button' })}
              className={`rounded-xl border px-3 py-2.5 text-base font-medium transition-all ${
              settings.mode === 'button'
                ? 'border-amber-400/60 bg-amber-400/10 text-amber-300'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            🔘 Nút bấm
          </button>
        </div>
      </div>

      {/* Effect duration */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Thời gian hiệu ứng (tối đa 20s):
          </label>
          <input
            type="number"
            value={durationInput}
            min={1}
            max={20}
            step={1}
            onChange={(e) => handleDurationChange(e.target.value)}
            onBlur={normalizeDuration}
            className="w-24 shrink-0 rounded-lg border border-amber-400/50 bg-slate-900/60 px-3 py-2.5 text-center text-base font-semibold text-slate-100 shadow-[0_0_0_1px_rgba(251,191,36,0.12)] focus:border-amber-300 focus:outline-none"
          />
        </div>
        <p className="text-xs text-slate-500">Số nguyên, tối đa 20 giây.</p>
      </div>

      {inputError && <InputErrorDialog message={inputError} onClose={() => setInputError('')} />}

      {/* Toggles */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ToggleRow
          icon={settings.effectsEnabled ? <Sparkles size={16} /> : <Sparkles size={16} className="opacity-40" />}
          label="Hiệu ứng kịch tính"
          desc="Quay vòng / animation hồi hộp"
          value={settings.effectsEnabled}
          onChange={(v) => onChange({ effectsEnabled: v })}
        />
        <ToggleRow
          icon={settings.groupEffectEnabled ? <Sparkles size={16} /> : <Sparkles size={16} className="opacity-40" />}
          label="Hiệu ứng chia phòng thi"
          desc="Hiển thị quá trình xáo trộn khi chia nhóm"
          value={settings.groupEffectEnabled}
          onChange={(v) => onChange({ groupEffectEnabled: v })}
        />
        <ToggleRow
          icon={settings.removeSelected ? <EyeOff size={16} /> : <Eye size={16} />}
          label="Xóa tên/số đã chọn"
          desc="Không lặp lại kết quả đã ra"
          value={settings.removeSelected}
          onChange={(v) => onChange({ removeSelected: v })}
        />
        <ToggleRow
          icon={<UserX size={16} />}
          label="Loại trừ tên/số"
          desc="Bật để mở danh sách cần loại trừ"
          value={settings.exclusionEnabled ?? excludedItems.length > 0}
          onChange={(v) => onChange({ exclusionEnabled: v })}
        />
      </div>

      {/* Exclusion picker */}
      {(settings.exclusionEnabled ?? excludedItems.length > 0) && (
        <ExclusionPicker
          items={items}
          excludedItems={excludedItems}
          onToggle={onToggleExcluded}
          onClearAll={onClearExcluded}
          onSelectAll={onSelectAllExcluded}
        />
      )}

      {/* Reset remaining */}
      {settings.removeSelected && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3">
          <div className="flex items-center gap-2 text-sm text-amber-300">
            <RefreshCw size={16} />
            <span>Đang ở chế độ xóa tên/số đã chọn. Reset danh sách bằng cách tắt rồi bật lại.</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({
  icon, label, desc, value, onChange,
}: { icon: React.ReactNode; label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition-all"
    >
      <div className="flex items-center gap-3">
        <span className={value ? 'text-amber-400' : 'text-slate-500'}>{icon}</span>
        <div className="text-left">
          <p className={`text-base font-medium ${value ? 'text-slate-200' : 'text-slate-400'}`}>{label}</p>
          <p className="text-xs text-slate-500">{desc}</p>
        </div>
      </div>
      <div className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-amber-500' : 'bg-slate-700'}`}>
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </div>
    </button>
  );
}
