
export enum ItemType {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT'
}

export interface PointAction {
  id: string;
  name: string;
  points: number;
  type: ItemType;
  icon: string; // URL or Emoji
  isLocal?: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  icon: string;
  stock: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  history: PointHistory[];
}

export interface PointHistory {
  id: string;
  actionId: string;
  actionName: string;
  points: number;
  timestamp: number;
}

export interface Theme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  glass: string;
  glow: string;
  text: string;
}

export type View = 'HOME' | 'USER_DETAILS' | 'ADMIN' | 'SHOP' | 'ORACLE' | 'LEADERBOARD';
