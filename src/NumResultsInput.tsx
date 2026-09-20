import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import InputErrorDialog from '@/InputErrorDialog';

interface Props {
  value: number;
  max: number;
  label?: string;
  onChange: (v: number) => void;
}

export default function NumResultsInput({ value, max, label = 'Số người cần chọn', onChange }: Props) {
  const [text, setText] = useState(String(value));
  const [inputError, setInputError] = useState('');

  // Sync external changes back into the field
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const commit = () => {
    const n = parseInt(text, 10);
    if (isNaN(n) || n < 1) {
      setInputError('Số cần chọn phải là số nguyên lớn hơn hoặc bằng 1. Hãy nhập lại một giá trị hợp lệ.');
      setText(String(value));
      return;
    }

    if (max > 0 && n > max) {
      setInputError(`Bạn đang nhập ${n}, nhưng số lượng tối đa hiện tại là ${max}. Hãy nhập một số nguyên từ 1 đến ${max}.`);
      setText(String(value));
      return;
    }

    onChange(n);
    setText(String(n));
  };

  return (
    <>
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
        <Users size={20} />
      </div>
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {label}
        </label>
        <input
          type="number"
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="Nhập số..."
          min={1}
          className="w-full rounded-lg bg-slate-800/60 border border-white/10 px-3 py-2 text-lg font-semibold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400/50"
        />
      </div>
    </div>
    {inputError && <InputErrorDialog message={inputError} onClose={() => setInputError('')} />}
    </>
  );
}
