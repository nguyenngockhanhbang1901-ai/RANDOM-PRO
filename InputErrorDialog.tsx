import { AlertCircle, X } from 'lucide-react';

interface Props {
  message: string;
  onClose: () => void;
}

export default function InputErrorDialog({ message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" role="presentation">
      <div
        className="w-full max-w-md rounded-2xl border border-red-400/30 bg-slate-900 p-6 shadow-2xl shadow-black/40"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="input-error-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-400/15 text-red-300">
            <AlertCircle size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h2 id="input-error-title" className="text-base font-semibold text-slate-100">Giá trị không hợp lệ</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-slate-100"
                aria-label="Đóng thông báo lỗi"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-400"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
