import { useCallback, useEffect, useMemo, useState } from 'react';
import { ListPlus, Settings, History, Layers, Dices, Volume2, VolumeX, Shuffle, Play } from 'lucide-react';
import { useLocalStorage } from '@/useLocalStorage';
import { useSound } from '@/useSound';
import type { NameList, RandomResult, GroupResult, Settings as SettingsType } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import ListManager from '@/ListManager';
import NumResultsInput from '@/NumResultsInput';
import WheelView from '@/WheelView';
import ButtonView from '@/ButtonView';
import HistoryPanel from '@/HistoryPanel';
import SettingsPanel from '@/SettingsPanel';
import InputErrorDialog from '@/InputErrorDialog';

type Tab = 'random' | 'groups' | 'lists' | 'history' | 'settings';

export default function App() {
  const [lists, setLists] = useLocalStorage<NameList[]>('rnd_lists', []);
  const [activeListId, setActiveListId] = useLocalStorage<string | null>('rnd_active_list', null);
  const [settings, setSettings] = useLocalStorage<SettingsType>('rnd_settings', DEFAULT_SETTINGS);
  const [history, setHistory] = useLocalStorage<(RandomResult | GroupResult)[]>('rnd_history', []);
  const [removedItems, setRemovedItems] = useLocalStorage<string[]>('rnd_removed', []);
  const [excludedItems, setExcludedItems] = useLocalStorage<string[]>('rnd_excluded', []);
  const [tab, setTab] = useState<Tab>('random');
  const [groupCount, setGroupCount] = useState(2);
  const [groupDisplay, setGroupDisplay] = useState<string[][] | null>(null);
  const [groupSpinning, setGroupSpinning] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const [inputError, setInputError] = useState('');

  const { play } = useSound(settings.soundEnabled);

  const activeList = useMemo(
    () => lists.find((l) => l.id === activeListId) ?? lists[0] ?? null,
    [lists, activeListId]
  );

  useEffect(() => {
    if (!activeListId && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [activeListId, lists, setActiveListId]);

  const listItems = activeList?.items ?? [];
  const exclusionEnabled = settings.exclusionEnabled ?? excludedItems.length > 0;
  const activeExcludedItems = exclusionEnabled ? excludedItems : [];
  const numberMax = settings.numberMax ?? DEFAULT_SETTINGS.numberMax;
  const numberItems = useMemo(() => {
    return settings.randomMode === 'numbers'
      ? Array.from({ length: Math.max(0, numberMax) }, (_, index) => String(index + 1))
      : listItems;
  }, [listItems, numberMax, settings.randomMode]);
  const items = settings.randomMode === 'numbers' ? numberItems : listItems;
  const remainingItems = useMemo(
    () =>
      items.filter(
        (i) => !settings.removeSelected || !removedItems.includes(i)
      ),
    [items, removedItems, settings.removeSelected]
  );
  const selectableItems = useMemo(
    () => remainingItems.filter((i) => !activeExcludedItems.includes(i)),
    [remainingItems, activeExcludedItems]
  );

  const updateSettings = useCallback((partial: Partial<SettingsType>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, [setSettings]);

  const handleSaveList = useCallback((name: string, listItems: string[]) => {
    const newList: NameList = {
      id: crypto.randomUUID(),
      name,
      items: listItems,
      createdAt: Date.now(),
    };
    setLists((prev) => [...prev, newList]);
    setActiveListId(newList.id);
    setRemovedItems([]);
    setExcludedItems([]);
  }, [setLists, setActiveListId, setRemovedItems, setExcludedItems]);

  const handleUpdateList = useCallback((id: string, name: string, listItems: string[]) => {
    setLists((prev) => prev.map((list) => list.id === id ? { ...list, name, items: listItems, createdAt: Date.now() } : list));
    setActiveListId(id);
    setRemovedItems([]);
    setExcludedItems([]);
  }, [setLists, setActiveListId, setRemovedItems, setExcludedItems]);

  const handleDeleteList = useCallback((id: string) => {
    setLists((prev) => {
      const remaining = prev.filter((l) => l.id !== id);
      if (activeListId === id) {
        setActiveListId(remaining[0]?.id ?? null);
        setRemovedItems([]);
        setExcludedItems([]);
      }
      return remaining;
    });
  }, [activeListId, setActiveListId, setRemovedItems, setExcludedItems, setLists]);

  const handleRandomResult = useCallback((selected: string[]) => {
    if (settings.removeSelected) {
      const uniqueSelected = [...new Set(selected)];
      setRemovedItems((prev) => [...new Set([...prev, ...uniqueSelected])]);
    }
    if (!activeList && settings.randomMode !== 'numbers') return;
    const result: RandomResult = {
      id: crypto.randomUUID(),
      listName: settings.randomMode === 'numbers'
        ? `Số từ 1 đến ${numberMax}`
        : activeList?.name ?? 'Danh sách',
      selected,
      mode: settings.mode,
      timestamp: Date.now(),
    };
    setHistory((prev) => [...prev, result]);
  }, [settings.removeSelected, settings.mode, settings.randomMode, numberMax, activeList, setRemovedItems, setHistory]);

  const handleGroupResult = useCallback((numGroups: number) => {
    if (!activeList && settings.randomMode !== 'numbers') return;
    const pool = items.filter((i) => !activeExcludedItems.includes(i));
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const groups: string[][] = Array.from({ length: numGroups }, () => []);
    shuffled.forEach((item, i) => {
      groups[i % numGroups].push(item);
    });
    const result: GroupResult = {
      id: crypto.randomUUID(),
      listName: settings.randomMode === 'numbers' ? `Số từ 1 đến ${numberMax}` : activeList?.name ?? 'Danh sách',
      groups,
      numGroups,
      timestamp: Date.now(),
    };
    setHistory((prev) => [...prev, result]);
  }, [activeList, items, activeExcludedItems, settings.randomMode, numberMax, setHistory]);

  const handleSplitGroups = useCallback(() => {
    if ((!activeList && settings.randomMode !== 'numbers') || items.length === 0 || groupCount < 1) return;

    setGroupSpinning(true);
    const pool = items.filter((item) => !activeExcludedItems.includes(item));
    setSelectedGroupIndex(null);
    const result: string[][] = Array.from({ length: groupCount }, () => []);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    shuffled.forEach((item, i) => {
      result[i % groupCount].push(item);
    });

    if (settings.groupEffectEnabled ?? true) {
      const durationMs = settings.effectDuration * 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= durationMs) {
          setGroupDisplay(result);
          setGroupSpinning(false);
          if (settings.soundEnabled) play('fanfare');
          handleGroupResult(groupCount);
          return;
        }

        const tempShuffled = [...pool].sort(() => Math.random() - 0.5);
        const tempResult: string[][] = Array.from({ length: groupCount }, () => []);
        tempShuffled.forEach((item, i) => {
          tempResult[i % groupCount].push(item);
        });
        setGroupDisplay(tempResult);
        if (settings.soundEnabled && Math.random() > 0.5) play('tick');
        requestAnimationFrame(animate);
      };

      animate();
      return;
    }

    setGroupDisplay(result);
    setGroupSpinning(false);
    if (settings.soundEnabled) play('fanfare');
    handleGroupResult(groupCount);
  }, [activeList, items, activeExcludedItems, groupCount, handleGroupResult, settings.randomMode, settings.groupEffectEnabled, settings.effectDuration, settings.soundEnabled, play]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'random', label: 'Random', icon: <Dices size={24} /> },
    { id: 'groups', label: (settings.groupEffectEnabled ?? true) ? 'Chia phòng' : 'Chia nhóm', icon: <Layers size={24} /> },
    { id: 'lists', label: 'Danh sách', icon: <ListPlus size={24} /> },
    { id: 'history', label: 'Lịch sử', icon: <History size={24} /> },
    { id: 'settings', label: 'Cài đặt', icon: <Settings size={24} /> },
  ];

  const getGroupNameFontSize = (name: string) => {
    if (name.length > 28) return '0.65rem';
    if (name.length > 20) return '0.72rem';
    if (name.length > 14) return '0.8rem';
    return '0.875rem';
  };
  const groupLabel = (settings.groupEffectEnabled ?? true) ? 'phòng' : 'nhóm';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/90 backdrop-blur-lg">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-900 font-bold text-lg shadow-lg shadow-amber-500/20">
              R
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Random Pro</h1>
              <p className="text-xs text-slate-500 leading-none mt-0.5">Quay số & chọn tên ngẫu nhiên</p>
            </div>
          </div>
          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-amber-400 hover:border-amber-400/30 transition-all"
          >
            {settings.soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <nav className="sticky top-[57px] z-20 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg">
        <div className="mx-auto w-full max-w-5xl px-2 flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); play('click'); }}
              className={`flex flex-1 flex-col items-center gap-1.5 whitespace-nowrap py-3 text-sm font-medium transition-all border-b-2 ${
                tab === t.id
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-1 px-4 py-6">
        {tab === 'random' && (
          <div className="space-y-4">
            <div className="lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-5">
              <div className="space-y-4">
                {/* Quick info bar */}
                {(activeList || settings.randomMode === 'numbers') && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-sm text-slate-400">{settings.randomMode === 'numbers' ? 'Số:' : 'Danh sách:'}</span>
                      <span className="truncate font-medium text-amber-300">
                        {settings.randomMode === 'numbers' ? `1 - ${numberMax}` : activeList?.name}
                      </span>
                    </div>
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-sm font-semibold text-amber-300">
                      {items.length}
                    </span>
                  </div>
                )}

                {/* Number of results — directly on Random screen */}
                {(activeList || settings.randomMode === 'numbers') && (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <NumResultsInput
                      value={settings.numResults}
                      max={selectableItems.length}
                      label={settings.randomMode === 'numbers' ? 'Số cần chọn' : 'Số người cần chọn'}
                      onChange={(v) => updateSettings({ numResults: v })}
                    />
                  </div>
                )}

                {settings.removeSelected && removedItems.length > 0 && (
                  <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3">
                    <button
                      onClick={() => setRemovedItems([])}
                      className="flex w-full items-center justify-center rounded-lg border border-white/10 bg-slate-900/40 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-amber-400/40 hover:text-amber-300"
                    >
                      ↻ Reset danh sách (đã xóa {removedItems.length} tên)
                    </button>
                  </div>
                )}
              </div>

              <div className="min-w-0 lg:-mt-1">
                {settings.mode === 'wheel' ? (
                  <WheelView
                    items={items}
                    duration={settings.effectDuration}
                    effectsEnabled={settings.effectsEnabled}
                    soundEnabled={settings.soundEnabled}
                    numResults={settings.numResults}
                    remainingItems={remainingItems}
                    excludedItems={settings.randomMode === 'numbers' ? [] : activeExcludedItems}
                    onResult={handleRandomResult}
                    onInvalidRequest={setInputError}
                    onTick={() => play('tick')}
                    onWhoosh={() => play('whoosh')}
                    onFanfare={() => play('fanfare')}
                  />
                ) : (
                  <ButtonView
                    items={items}
                    duration={settings.effectDuration}
                    effectsEnabled={settings.effectsEnabled}
                    soundEnabled={settings.soundEnabled}
                    numResults={settings.numResults}
                    remainingItems={remainingItems}
                    excludedItems={settings.randomMode === 'numbers' ? [] : activeExcludedItems}
                    onResult={handleRandomResult}
                    onInvalidRequest={setInputError}
                    onTick={() => play('tick')}
                    onFanfare={() => play('fanfare')}
                  />
                )}

              </div>
            </div>
            {inputError && <InputErrorDialog message={inputError} onClose={() => setInputError('')} />}
          </div>
        )}

        {tab === 'groups' && (
          <div className="lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-5">
            <div className="space-y-4">
              {activeList || settings.randomMode === 'numbers' ? (
                <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{settings.randomMode === 'numbers' ? 'Nguồn số đang chọn' : 'Danh sách đang chọn'}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-amber-300">{settings.randomMode === 'numbers' ? `Số từ 1 đến ${numberMax}` : activeList?.name}</span>
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-sm font-semibold text-amber-300">
                      {items.length}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-500">
                  {settings.randomMode === 'numbers' ? 'Hãy nhập giá trị số trong Cài đặt.' : 'Chưa có danh sách nào được chọn.'}
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <label className="mb-2 block text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Số lượng {groupLabel}
                </label>
                <input
                  type="number"
                  value={groupCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!Number.isNaN(value) && value >= 1) setGroupCount(value);
                  }}
                  min={1}
                  max={items.length || 1}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/60 px-4 py-3 text-lg text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                />

                <button
                  onClick={handleSplitGroups}
                  disabled={groupSpinning || ((!activeList && settings.randomMode !== 'numbers') || items.length === 0) || groupCount < 1}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-bold text-slate-900 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {groupSpinning ? <Shuffle className="animate-pulse" size={20} /> : <Play size={20} />}
                  {groupSpinning ? 'Đang chia...' : (groupLabel === 'phòng' ? 'Chia phòng' : 'Chia nhóm')}
                </button>
              </div>

              {groupDisplay && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
                    <Shuffle className={groupSpinning ? 'animate-pulse' : ''} size={18} />
                    {groupSpinning ? 'Đang xáo trộn phòng thi...' : 'Kết quả các phòng thi'}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {groupDisplay.map((group, index) => (
                      <button
                        key={index}
                        type="button"
                        disabled={groupSpinning}
                        onClick={() => setSelectedGroupIndex(index)}
                        className={`rounded-lg border p-2 text-left transition ${selectedGroupIndex === index ? 'border-amber-400/60 bg-amber-400/10' : 'border-white/10 bg-slate-900/50 hover:border-amber-400/40'} disabled:cursor-default`}
                      >
                        <p className="mb-1 text-xs font-semibold text-slate-400">Phòng {index + 1}</p>
                        <div className="space-y-1">
                          {group.slice(0, 4).map((name, nameIndex) => (
                            <div key={nameIndex} className="truncate rounded bg-slate-800/70 px-2 py-1 text-xs text-slate-300">
                              {name}
                            </div>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="min-w-0 lg:-mt-1">
              {groupDisplay && !groupSpinning ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  {selectedGroupIndex !== null && groupDisplay[selectedGroupIndex] ? (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kết quả Phòng {selectedGroupIndex + 1}</p>
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-300">
                          {groupDisplay[selectedGroupIndex].length} người
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {groupDisplay[selectedGroupIndex].map((name, index) => (
                          <div key={index} className="min-w-0 rounded-lg bg-slate-800/70 px-2 py-2 text-center text-slate-200">
                            <span className="block whitespace-normal break-words leading-tight" style={{ fontSize: getGroupNameFontSize(name) }}>{name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Kết quả</p>
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-300">
                          {groupDisplay.length} {groupLabel}
                        </span>
                      </div>
                      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(groupDisplay.length, 4)}, minmax(0, 1fr))` }}>
                        {groupDisplay.map((group, i) => (
                          <div key={i} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                            <div className="mb-2 flex items-center gap-2 border-b border-white/10 pb-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-sm font-bold text-amber-300">{i + 1}</span>
                              <span className="text-sm font-semibold text-slate-300">{groupLabel === 'phòng' ? 'Phòng' : 'Nhóm'} {i + 1}</span>
                              <span className="ml-auto text-xs text-slate-500">{group.length} người</span>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {group.map((name, j) => (
                                <div key={j} className="rounded-lg bg-slate-800/70 px-2.5 py-1.5 text-sm text-slate-200 animate-[fadeIn_0.3s_ease]" style={{ animationDelay: `${j * 0.05}s` }}>
                                  {name}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 text-sm text-slate-500">
                  Chưa có kết quả nào.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'lists' && (
          <div className="w-full min-w-0">
            <ListManager
              lists={lists}
              activeListId={activeListId}
              onSelectList={(id) => { setActiveListId(id); setRemovedItems([]); setExcludedItems([]); }}
              onSaveList={handleSaveList}
              onUpdateList={handleUpdateList}
              onDeleteList={handleDeleteList}
            />
          </div>
        )}

        {tab === 'history' && (
          <HistoryPanel
            history={history}
            onClear={() => setHistory([])}
          />
        )}

        {tab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onChange={updateSettings}
            items={items}
            excludedItems={excludedItems}
            onToggleExcluded={(item) =>
              setExcludedItems((prev) =>
                prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
              )
            }
            onClearExcluded={() => setExcludedItems([])}
            onSelectAllExcluded={() => setExcludedItems(items)}
          />
        )}
      </main>

      <footer className="border-t border-white/5 px-4 py-4 text-xs text-slate-600">
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center">
          <span className="text-center">Random Pro — Chạy offline trên máy tính & điện thoại</span>
          <span className="absolute right-2 shrink-0 text-right">Cát Tường</span>
        </div>
      </footer>
    </div>
  );
}
