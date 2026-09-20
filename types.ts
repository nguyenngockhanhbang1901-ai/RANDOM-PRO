export interface NameList {
  id: string;
  name: string;
  items: string[];
  createdAt: number;
}

export interface RandomResult {
  id: string;
  listName: string;
  selected: string[];
  mode: 'wheel' | 'button';
  timestamp: number;
}

export interface GroupResult {
  id: string;
  listName: string;
  groups: string[][];
  numGroups: number;
  timestamp: number;
}

export interface Settings {
  effectDuration: number;
  randomMode: 'list' | 'numbers';
  numberMax: number;
  soundEnabled: boolean;
  effectsEnabled: boolean;
  groupEffectEnabled: boolean;
  removeSelected: boolean;
  exclusionEnabled: boolean;
  mode: 'wheel' | 'button';
  numResults: number;
}

export const DEFAULT_SETTINGS: Settings = {
  effectDuration: 4,
  randomMode: 'list',
  numberMin: 1,
  numberMax: 100,
  soundEnabled: true,
  effectsEnabled: true,
  groupEffectEnabled: true,
  removeSelected: false,
  exclusionEnabled: false,
  mode: 'wheel',
  numResults: 1,
};
