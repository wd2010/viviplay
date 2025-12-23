
import { PointAction, ItemType, ShopItem, Theme } from './types';

export const DEFAULT_ACTIONS: PointAction[] = [
  { id: '1', name: '阅读书籍', points: 10, type: ItemType.ADD, icon: '📚' },
  { id: '2', name: '乐于助人', points: 15, type: ItemType.ADD, icon: '🤝' },
  { id: '3', name: '坚持锻炼', points: 20, type: ItemType.ADD, icon: '⚔️' },
  { id: '4', name: '偷吃甜食', points: 5, type: ItemType.SUBTRACT, icon: '🍬' },
  { id: '5', name: '熬夜晚睡', points: 15, type: ItemType.SUBTRACT, icon: '🌙' },
  { id: '6', name: '乱发脾气', points: 25, type: ItemType.SUBTRACT, icon: '🔥' },
];

export const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  { id: 's1', name: '魔法药剂', cost: 100, icon: '🧪', stock: 5 },
  { id: 's2', name: '传说之剑', cost: 500, icon: '🗡️', stock: 1 },
  { id: 's3', name: '喷火幼龙', cost: 2000, icon: '🐉', stock: 1 },
];

export const ADMIN_PASSWORD = '123456';

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: '暗夜幽邃',
    primary: '#9333ea', // purple-600
    secondary: '#2563eb', // blue-600
    bg: '#0f172a', // slate-950
    glass: 'rgba(30, 41, 59, 0.7)',
    glow: 'rgba(139, 92, 246, 0.5)',
    text: '#f8fafc'
  },
  {
    id: 'emerald',
    name: '翡翠森之灵',
    primary: '#059669', // emerald-600
    secondary: '#0891b2', // cyan-600
    bg: '#064e3b', // green-950
    glass: 'rgba(6, 78, 59, 0.6)',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: '#ecfdf5'
  },
  {
    id: 'inferno',
    name: '熔岩炼狱',
    primary: '#dc2626', // red-600
    secondary: '#ea580c', // orange-600
    bg: '#450a0a', // red-950
    glass: 'rgba(69, 10, 10, 0.6)',
    glow: 'rgba(239, 68, 68, 0.4)',
    text: '#fef2f2'
  },
  {
    id: 'royal',
    name: '辉煌圣殿',
    primary: '#d97706', // amber-600
    secondary: '#ca8a04', // yellow-600
    bg: '#1e1b4b', // indigo-950
    glass: 'rgba(30, 27, 75, 0.7)',
    glow: 'rgba(245, 158, 11, 0.3)',
    text: '#fffbeb'
  },
  {
    id: 'frozen',
    name: '极境冰原',
    primary: '#2563eb', // blue-600
    secondary: '#0ea5e9', // sky-500
    bg: '#082f49', // sky-950
    glass: 'rgba(8, 47, 73, 0.6)',
    glow: 'rgba(14, 165, 233, 0.4)',
    text: '#f0f9ff'
  },
  {
    id: 'clouds',
    name: '云端天际',
    primary: '#3b82f6', // blue-500
    secondary: '#60a5fa', // blue-400
    bg: '#f8fafc', // slate-50
    glass: 'rgba(255, 255, 255, 0.8)',
    glow: 'rgba(59, 130, 246, 0.2)',
    text: '#1e293b' // slate-800
  },
  {
    id: 'sakura',
    name: '樱落幽谷',
    primary: '#ec4899', // pink-500
    secondary: '#f43f5e', // rose-500
    bg: '#fff1f2', // rose-50
    glass: 'rgba(255, 255, 255, 0.8)',
    glow: 'rgba(236, 72, 153, 0.2)',
    text: '#881337' // rose-900
  },
  {
    id: 'dawn',
    name: '晨曦神庙',
    primary: '#f59e0b', // amber-500
    secondary: '#fbbf24', // amber-400
    bg: '#fffbeb', // amber-50
    glass: 'rgba(255, 255, 255, 0.8)',
    glow: 'rgba(245, 158, 11, 0.2)',
    text: '#78350f' // amber-900
  },
  {
    id: 'pearl',
    name: '月石祭坛',
    primary: '#6366f1', // indigo-500
    secondary: '#a855f7', // purple-500
    bg: '#f5f3ff', // purple-50
    glass: 'rgba(255, 255, 255, 0.8)',
    glow: 'rgba(99, 102, 241, 0.2)',
    text: '#4c1d95' // purple-900
  }
];

export const MAGIC_ICONS = [
  '⚔️', '🛡️', '🏹', '🪄', '🧪', '🔮', '📜', '🗺️', '🗝️', '💎', '👑', '🏰', '🏔️', '🌋', '🌲', '🐉', '🦄', '🐺', '🦁', '🦉', '🦅', 
  '🧙', '🧛', '🧜', '🧝', '🧞', '🧟', '👹', '👺', '👻', '💀', '👽', '🤖', '🎃', '🕯️', '⛓️', '⚰️', '⚱️', '🧿', '📿', '🏺', '🏮', '🎐', '🧧',
  '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🎫', '🎭', '🎨', '🎬', '🎤', '🎧', '🎹', '🎸', '🎻', '🎷', '🎺', '🎸', '🪕',
  '🎲', '🎯', '🎳', '🎮', '🎰', '🧩', '🪁', '🏸', '🎾', '⚽', '🏀', '🏐', '🏈', '🏉', '⚾', '🥎', '🥏',
  '📚', '📖', '📒', '📔', '📓', '📒', '📜', '📄', '📅', '📍', '🗺️', '🔔', '📣', '🔋', '🛠️', '💊', '🩸', '🛒', '🛍️', '🧴', '🧹', '🧼',
  '❤️', '✨', '🌟', '🔥', '💧', '⚡', '🌈', '☀️', '🌙', '☁️', '❄️', '💤', '💢', '💭', '💬', '🔔', '🔕', '✅', '❌', '⚠️', '🛡️',
  '🍀', '🌿', '🍄', '🍎', '🍓', '🍇', '🍉', '🍕', '🍔', '🍟', '🍦', '🍩', '🍬', '🍭', '🍺', '🍷', '☕', '🍵', '🍼',
];
