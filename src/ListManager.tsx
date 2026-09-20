import { useState } from 'react';
import { Plus, Trash2, Save, List as ListIcon, Check, PencilLine, X } from 'lucide-react';
import type { NameList } from '@/types';

interface Props {
  lists: NameList[];
  activeListId: string | null;
  onSelectList: (id: string) => void;
  onSaveList: (name: string, items: string[]) => void;
  onUpdateList: (id: string, name: string, items: string[]) => void;
  onDeleteList: (id: string) => void;
}

export default function ListManager({ lists, activeListId, onSelectList, onSaveList, onUpdateList, onDeleteList }: Props) {
  const [editing, setEditing] = useState(false);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listName, setListName] = useState('');
  const [text, setText] = useState('');

  const resetForm = () => {
    setEditing(false);
    setEditingListId(null);
    setListName('');
    setText('');
  };

  const handleSave = () => {
    const items = text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!listName.trim() || items.length === 0) return;

    if (editingListId) {
      onUpdateList(editingListId, listName.trim(), items);
    } else {
      onSaveList(listName.trim(), items);
    }

    resetForm();
  };

  const handleEdit = (list: NameList) => {
    setEditing(true);
    setEditingListId(list.id);
    setListName(list.name);
    setText(list.items.join('\n'));
  };

  const activeList = lists.find((l) => l.id === activeListId);

  return (
    <div className="w-full lg:grid lg:grid-cols-[360px_1fr] lg:gap-5">
      <div className="space-y-4">
      {lists.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Danh sách đã lưu</h3>
          <div className="space-y-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className={`group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition-all cursor-pointer ${
                  list.id === activeListId
                    ? 'border-amber-400/70 bg-amber-400/10 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }`}
                onClick={() => onSelectList(list.id)}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${list.id === activeListId ? 'bg-amber-400/15 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                    <ListIcon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-base font-semibold ${list.id === activeListId ? 'text-amber-300' : 'text-slate-200'}`}>
                        {list.name}
                      </p>
                      {list.id === activeListId && <Check size={16} className="text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500">{list.items.length} phần tử</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(list); }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
                    aria-label={`Chỉnh sửa ${list.name}`}
                  >
                    <PencilLine size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-slate-900/60 text-slate-300 transition hover:border-red-400/40 hover:text-red-400"
                    aria-label={`Xóa ${list.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!editing && (
        <button
          onClick={() => {
            setEditing(true);
            setEditingListId(null);
            setListName('');
            setText('');
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 px-4 py-4 text-slate-300 transition hover:border-amber-400/40 hover:bg-amber-400/5 hover:text-amber-300"
        >
          <Plus size={20} /> Tạo danh sách mới
        </button>
      )}
      </div>

      <div className="min-w-0">
      {editing && (
        <div className="space-y-3 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">
                {editingListId ? 'Chỉnh sửa danh sách' : 'Tạo danh sách mới'}
              </h3>
              <button
                onClick={resetForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-slate-200"
                aria-label="Đóng form"
              >
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              placeholder="Tên danh sách (vd: Lớp 10A1)"
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
            />
          <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập mỗi tên / số trên một dòng&#10;Ví dụ:&#10;Nguyễn Văn A&#10;Trần Thị B&#10;Lê Văn C"
            rows={8}
            className="w-full resize-y rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
          />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!listName.trim() || !text.trim()}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 font-medium text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save size={18} /> {editingListId ? 'Lưu thay đổi' : 'Lưu danh sách'}
              </button>
              <button
                onClick={resetForm}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-slate-300 transition hover:bg-white/5"
              >
                Hủy
              </button>
            </div>
        </div>
      )}

      {activeList && !editing && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Danh sách đang chọn</p>
            <h4 className="mt-1 font-semibold text-slate-200">{activeList.name}</h4>
          </div>
          <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-900/60 px-3 py-2">
            <span className="text-sm text-slate-400">Số phần tử</span>
            <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-amber-400/15 px-2.5 py-1 text-sm font-semibold text-amber-300">
              {activeList.items.length}
            </span>
          </div>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
            {activeList.items.map((item, i) => (
              <span key={i} className="rounded-lg bg-slate-800/70 px-2.5 py-1.5 text-sm text-slate-300 ring-1 ring-inset ring-white/5">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
