
import React, { useState, useEffect, useRef } from 'react';
import { User, View, PointAction, ShopItem, ItemType, PointHistory, Theme } from './types';
import { DEFAULT_ACTIONS, DEFAULT_SHOP_ITEMS, ADMIN_PASSWORD, MAGIC_ICONS, THEMES } from './constants';
import { audioService } from './services/audioService';
import { getFantasyAdvice } from './services/geminiService';
import Layout from './components/Layout';

/**
 * PWA 更新提示组件
 */
const UpdateBanner: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in slide-in-from-top-full duration-500">
      <div className="glass p-4 rounded-2xl flex items-center justify-between border-2 border-yellow-500/30 magical-glow bg-slate-900/90 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📜</span>
          <div className="text-left">
            <h4 className="font-bold text-sm">古卷更新</h4>
            <p className="text-[10px] opacity-70">乐园的境界已经提升，是否立即刷新？</p>
          </div>
        </div>
        <button 
          onClick={onUpdate}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
        >
          立即觉醒
        </button>
      </div>
    </div>
  );
};

/**
 * 魔法数字滚动组件
 */
const AnimatedNumber: React.FC<{ value: number, className?: string }> = ({ value, className }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(startValue + (endValue - startValue) * easeProgress);
      
      setDisplayValue(currentCount);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <span className={className}>{displayValue}</span>;
};

/**
 * 图标选择器组件
 */
const IconPicker: React.FC<{ 
  selectedIcon: string, 
  onSelect: (icon: string) => void 
}> = ({ selectedIcon, onSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSelect(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold opacity-60">选择图标或上传</label>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-full transition-colors text-white"
        >
          📁 上传图片
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileUpload} 
        />
      </div>
      
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 h-40 overflow-y-auto p-2 border border-slate-700/20 rounded-xl bg-black/5">
        {MAGIC_ICONS.map(icon => (
          <button
            key={icon}
            onClick={() => onSelect(icon)}
            className={`text-2xl p-2 rounded-lg transition-all ${selectedIcon === icon ? 'bg-purple-600 scale-110 text-white' : 'hover:bg-black/10'}`}
          >
            {icon}
          </button>
        ))}
      </div>

      {selectedIcon.startsWith('data:') && (
        <div className="mt-2 flex items-center gap-3 p-2 bg-black/5 rounded-lg border border-slate-700/10">
          <img src={selectedIcon} className="w-10 h-10 object-cover rounded shadow" />
          <span className="text-xs opacity-60">已上传本地图片</span>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('HOME');
  const [users, setUsers] = useState<User[]>([]);
  const [actions, setActions] = useState<PointAction[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [oracleMsg, setOracleMsg] = useState<string>('欢迎，荣耀的追寻者。');
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);
  const [updateAvailable, setUpdateAvailable] = useState<ServiceWorkerRegistration | null>(null);
  
  // 管理状态
  const [editingAction, setEditingAction] = useState<Partial<PointAction> | null>(null);
  const [editingShopItem, setEditingShopItem] = useState<Partial<ShopItem> | null>(null);

  // 密码校验状态
  const [passCallback, setPassCallback] = useState<(() => void) | null>(null);
  const [passInput, setPassInput] = useState('');
  const [showForgotHint, setShowForgotHint] = useState(false);

  // Persistence
  useEffect(() => {
    const savedUsers = localStorage.getItem('fp_users');
    const savedActions = localStorage.getItem('fp_actions');
    const savedShop = localStorage.getItem('fp_shop');
    const savedThemeId = localStorage.getItem('fp_theme_id');

    setUsers(savedUsers ? JSON.parse(savedUsers) : []);
    setActions(savedActions ? JSON.parse(savedActions) : DEFAULT_ACTIONS);
    setShopItems(savedShop ? JSON.parse(savedShop) : DEFAULT_SHOP_ITEMS);
    
    if (savedThemeId) {
      const theme = THEMES.find(t => t.id === savedThemeId);
      if (theme) setActiveTheme(theme);
    }

    // 监听 PWA 更新事件
    const handleUpdate = (e: any) => {
      setUpdateAvailable(e.detail);
    };
    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  useEffect(() => localStorage.setItem('fp_users', JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem('fp_actions', JSON.stringify(actions)), [actions]);
  useEffect(() => localStorage.setItem('fp_shop', JSON.stringify(shopItems)), [shopItems]);
  useEffect(() => localStorage.setItem('fp_theme_id', activeTheme.id), [activeTheme]);

  const handleUpdateApp = () => {
    if (updateAvailable && updateAvailable.waiting) {
      updateAvailable.waiting.postMessage('skipWaiting');
    }
  };

  const handleCreateUser = (name: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      name,
      avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${name}`,
      points: 0,
      history: []
    };
    setUsers([...users, newUser]);
  };

  const verifyPass = (action: () => void) => {
    setPassCallback(() => action);
    setPassInput('');
    setShowForgotHint(false);
  };

  const handlePassSubmit = () => {
    if (passInput === ADMIN_PASSWORD) {
      if (passCallback) passCallback();
      setPassCallback(null);
    } else {
      audioService.playFail();
      alert('大门依然紧闭。密码错误。');
    }
  };

  const handleAction = (user: User, action: PointAction) => {
    if (action.type === ItemType.ADD) audioService.playCoin();
    else audioService.playFail();

    const change = action.type === ItemType.ADD ? action.points : -action.points;
    const newHistory: PointHistory = {
      id: Date.now().toString(),
      actionId: action.id,
      actionName: action.name,
      points: change,
      timestamp: Date.now()
    };

    const updatedUsers = users.map(u => u.id === user.id ? {
      ...u,
      points: Math.max(0, u.points + change),
      history: [newHistory, ...u.history].slice(0, 50)
    } : u);

    setUsers(updatedUsers);
    if (selectedUser?.id === user.id) {
        setSelectedUser(updatedUsers.find(u => u.id === user.id) || null);
    }
  };

  const handleBuy = (user: User, item: ShopItem) => {
    if (user.points < item.cost) {
      audioService.playFail();
      alert('积分不足，旅行者！');
      return;
    }
    if (item.stock <= 0) {
      alert('库存已经卖完了！');
      return;
    }

    audioService.playMagic();
    const updatedUsers = users.map(u => u.id === user.id ? {
      ...u,
      points: u.points - item.cost,
      history: [{
        id: Date.now().toString(),
        actionId: item.id,
        actionName: `购买了 ${item.name}`,
        points: -item.cost,
        timestamp: Date.now()
      }, ...u.history]
    } : u);

    setUsers(updatedUsers);
    setShopItems(shopItems.map(si => si.id === item.id ? { ...si, stock: si.stock - 1 } : si));
    if (selectedUser?.id === user.id) {
      setSelectedUser(updatedUsers.find(u => u.id === user.id) || null);
    }
  };

  const askOracle = async () => {
    if (!selectedUser) {
        alert('请先选择一位旅行者！');
        return;
    }
    setIsOracleLoading(true);
    const msg = await getFantasyAdvice(selectedUser.points, selectedUser.name);
    setOracleMsg(msg);
    setIsOracleLoading(false);
  };

  const renderIcon = (icon: string, className: string = "w-10 h-10") => {
    if (icon.startsWith('data:') || icon.startsWith('http')) {
        return <img src={icon} className={`${className} object-cover rounded-lg`} alt="icon" />;
    }
    return <span className={className.replace('w-', 'text-')}>{icon}</span>;
  }

  // UI Views
  const renderHome = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
      {users.length === 0 && (
        <div className="col-span-full text-center py-20 glass rounded-3xl">
          <p className="text-xl opacity-60">目前乐园中还没有任何旅行者。</p>
          <button 
            onClick={() => setView('ADMIN')}
            className="mt-6 px-8 py-3 rounded-full font-bold magical-glow transition-colors text-white"
            style={{ backgroundColor: activeTheme.primary }}
          >
            召唤旅行者
          </button>
        </div>
      )}
      {users.map(u => (
        <div 
          key={u.id} 
          onClick={() => { setSelectedUser(u); setView('USER_DETAILS'); }}
          className="glass p-6 rounded-3xl cursor-pointer hover:scale-[1.02] transition-transform group relative overflow-hidden"
        >
          <div className="flex items-center gap-4">
            <img src={u.avatar} alt={u.name} className="w-20 h-20 rounded-2xl bg-black/20" />
            <div>
              <h3 className="text-2xl font-bold">{u.name}</h3>
              <p className="text-yellow-600 font-bold flex items-center gap-1">
                <span className="text-lg">✨</span> 
                <AnimatedNumber value={u.points} />
                <span> 积分</span>
              </p>
            </div>
          </div>
          <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-2xl">➡️</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLeaderboard = () => {
    const sortedUsers = [...users].sort((a, b) => b.points - a.points);
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-4xl font-bold fantasy-font tracking-tighter text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, #fbbf24, #d97706)` }}>巅峰荣耀榜</h2>
          <p className="opacity-60">只有真正的勇者才能登上卷轴之首</p>
        </div>
        
        <div className="space-y-3">
          {sortedUsers.map((u, index) => {
            const isTop3 = index < 3;
            const rankIcon = index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const glowClass = index === 0 ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 
                             index === 1 ? 'border-slate-300/50 shadow-[0_0_15px_rgba(203,213,225,0.2)]' :
                             index === 2 ? 'border-amber-600/50 shadow-[0_0_15px_rgba(180,83,9,0.2)]' : 'border-black/5';

            return (
              <div 
                key={u.id} 
                className={`glass p-4 rounded-2xl border flex items-center justify-between transition-all hover:bg-black/5 ${glowClass}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center font-bold text-xl ${isTop3 ? 'scale-125' : 'opacity-40 text-sm'}`}>
                    {rankIcon}
                  </div>
                  <img src={u.avatar} className="w-12 h-12 rounded-xl bg-black/20" />
                  <div>
                    <h3 className="font-bold text-lg">{u.name}</h3>
                    {index === 0 && <span className="text-[10px] uppercase tracking-widest text-yellow-600 font-black">当前霸主</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-yellow-600">
                    <AnimatedNumber value={u.points} />
                  </p>
                  <p className="text-[10px] uppercase opacity-40 font-bold">Total Points</p>
                </div>
              </div>
            );
          })}
          {users.length === 0 && <p className="text-center py-20 opacity-40">尚无勇者留下姓名。</p>}
        </div>
      </div>
    );
  };

  const renderUserDetails = () => {
    if (!selectedUser) return null;

    const positiveActions = actions.filter(a => a.type === ItemType.ADD);
    const negativeActions = actions.filter(a => a.type === ItemType.SUBTRACT);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <button onClick={() => setView('HOME')} className="opacity-60 hover:opacity-100 flex items-center gap-2 font-bold">
          ← 返回乐园首页
        </button>

        <div className="glass p-8 rounded-[40px] flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
             <span className="text-9xl">✨</span>
          </div>
          <img src={selectedUser.avatar} className="w-32 h-32 rounded-3xl bg-black/20 border-4 z-10" style={{ borderColor: `${activeTheme.primary}4d` }} />
          <div className="text-center md:text-left flex-1 z-10">
            <h2 className="text-4xl font-bold fantasy-font tracking-wide">{selectedUser.name}</h2>
            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-700 px-6 py-2 rounded-full border border-yellow-500/30">
              <span className="text-xl">🌟</span>
              <span className="text-2xl font-bold">
                <AnimatedNumber value={selectedUser.points} />
              </span>
              <span className="text-sm font-medium uppercase tracking-widest opacity-80 pl-1">当前积分</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-green-600">
                <span className="p-2 bg-green-500/10 rounded-lg">🛡️</span> 荣耀事迹 (加分)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {positiveActions.length === 0 && <p className="col-span-full opacity-40 text-sm py-4 italic">尚未定义荣耀法则...</p>}
                {positiveActions.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleAction(selectedUser, a)}
                    className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 hover:scale-105 transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="transition-transform group-hover:rotate-12">
                      {renderIcon(a.icon, "w-12 h-12 text-3xl")}
                    </div>
                    <span className="text-xs font-bold uppercase truncate w-full text-center mt-1">{a.name}</span>
                    <span className="text-sm font-bold text-green-600">+{a.points}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2 text-red-600">
                <span className="p-2 bg-red-500/10 rounded-lg">⚠️</span> 试炼挑战 (减分)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {negativeActions.length === 0 && <p className="col-span-full opacity-40 text-sm py-4 italic">勇者尚未面临诱惑...</p>}
                {negativeActions.map(a => (
                  <button
                    key={a.id}
                    onClick={() => handleAction(selectedUser, a)}
                    className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:scale-105 transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className="transition-transform group-hover:-rotate-12">
                      {renderIcon(a.icon, "w-12 h-12 text-3xl")}
                    </div>
                    <span className="text-xs font-bold uppercase truncate w-full text-center mt-1">{a.name}</span>
                    <span className="text-sm font-bold text-red-600">-{a.points}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="p-2 bg-blue-500/10 rounded-lg text-blue-600">📜</span> 历史卷轴
            </h3>
            <div className="glass rounded-[32px] overflow-hidden border border-slate-700/10">
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {selectedUser.history.length === 0 && (
                  <div className="p-12 text-center opacity-40 italic">
                    <span className="text-4xl block mb-2">🐚</span>
                    史书尚未动笔...
                  </div>
                )}
                {selectedUser.history.map((h, i) => (
                  <div 
                    key={h.id} 
                    className={`p-5 border-b border-slate-700/5 flex justify-between items-center transition-colors hover:bg-black/5 ${i === 0 ? 'bg-black/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${h.points >= 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                      <div>
                        <p className="font-bold">{h.actionName}</p>
                        <p className="text-[11px] uppercase opacity-40 font-bold tracking-wider">{new Date(h.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className={`px-4 py-1 rounded-full text-sm font-black ${h.points >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                      {h.points >= 0 ? '+' : ''}{h.points}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderShop = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold fantasy-font">奇幻宝库</h2>
        {selectedUser && (
           <div className="bg-black/5 px-4 py-2 rounded-xl flex items-center gap-3 border border-slate-700/10">
             <img src={selectedUser.avatar} className="w-8 h-8 rounded-lg" />
             <div className="text-yellow-600 font-bold">
                <AnimatedNumber value={selectedUser.points} />
                <span className="ml-1">✨</span>
             </div>
           </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopItems.map(item => (
          <div key={item.id} className="glass p-6 rounded-3xl flex flex-col items-center gap-4 relative">
             <div className="mb-2">
                {renderIcon(item.icon, "w-20 h-20 text-6xl")}
             </div>
             <div className="text-center">
               <h3 className="text-xl font-bold">{item.name}</h3>
               <p className="opacity-40 text-sm">库存: {item.stock}</p>
             </div>
             <button
               disabled={!selectedUser || item.stock <= 0 || selectedUser.points < item.cost}
               onClick={() => selectedUser && handleBuy(selectedUser, item)}
               className="w-full py-3 rounded-2xl font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white shadow-lg"
               style={{ backgroundColor: activeTheme.primary }}
             >
               {item.cost} 积分兑换
             </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="space-y-12 animate-in fade-in duration-500 pb-24">
      {/* 角色管理 */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">🧙 召唤旅行者</h2>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="输入新旅行者的名字..." 
            className="flex-1 bg-black/5 border border-slate-700/20 rounded-2xl px-4 py-3 focus:ring-2 outline-none font-bold"
            style={{ borderColor: activeTheme.primary }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                handleCreateUser(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
        </div>
        <div className="glass rounded-3xl overflow-hidden">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between p-4 border-b border-slate-700/5">
              <div className="flex items-center gap-3">
                <img src={u.avatar} className="w-10 h-10 rounded-lg" />
                <span className="font-bold">{u.name}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const newName = prompt('重命名旅行者:', u.name);
                    if (newName) verifyPass(() => setUsers(users.map(x => x.id === u.id ? {...x, name: newName} : x)));
                  }} 
                  className="p-2 text-blue-600 hover:bg-blue-600/10 rounded-lg transition-colors"
                >✏️</button>
                <button onClick={() => verifyPass(() => setUsers(users.filter(x => x.id !== u.id)))} className="p-2 text-red-600 hover:bg-red-600/10 rounded-lg transition-colors">🗑️</button>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="p-8 text-center opacity-40 italic">尚未有旅行者加入旅途</p>}
        </div>
      </section>

      {/* 积分规则管理 */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">📖 积分规则管理</h2>
            <button 
                onClick={() => setEditingAction({ name: '', points: 10, type: ItemType.ADD, icon: '✨' })}
                className="px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all text-white"
                style={{ backgroundColor: activeTheme.primary }}
            >+ 新规则</button>
        </div>

        {editingAction && (
          <div className="glass p-6 rounded-3xl border-2 space-y-4 animate-in slide-in-from-top-4 shadow-xl" style={{ borderColor: `${activeTheme.primary}80` }}>
             <h3 className="text-lg font-bold">创建/编辑积分规则</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm opacity-60 font-bold">名称</label>
                    <input 
                      className="w-full bg-black/5 p-2 rounded-lg border border-slate-700/20 font-bold" 
                      value={editingAction.name} 
                      onChange={e => setEditingAction({...editingAction, name: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm opacity-60 font-bold">分值</label>
                    <input 
                      type="number"
                      className="w-full bg-black/5 p-2 rounded-lg border border-slate-700/20 font-bold" 
                      value={editingAction.points} 
                      onChange={e => setEditingAction({...editingAction, points: parseInt(e.target.value) || 0})}
                    />
                </div>
             </div>
             <div className="flex gap-6 py-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input type="radio" className="w-4 h-4" checked={editingAction.type === ItemType.ADD} onChange={() => setEditingAction({...editingAction, type: ItemType.ADD})} />
                    <span className="text-green-600">加分</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input type="radio" className="w-4 h-4" checked={editingAction.type === ItemType.SUBTRACT} onChange={() => setEditingAction({...editingAction, type: ItemType.SUBTRACT})} />
                    <span className="text-red-600">减分</span>
                </label>
             </div>
             
             <IconPicker selectedIcon={editingAction.icon || '✨'} onSelect={icon => setEditingAction({...editingAction, icon})} />

             <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    if (editingAction.name) {
                        const newAction = { ...editingAction, id: editingAction.id || Date.now().toString() } as PointAction;
                        setActions(prev => editingAction.id ? prev.map(a => a.id === editingAction.id ? newAction : a) : [...prev, newAction]);
                        setEditingAction(null);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: activeTheme.primary }}
                >保存</button>
                <button onClick={() => setEditingAction(null)} className="flex-1 py-3 bg-slate-600 rounded-xl font-bold text-white">取消</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {actions.map(a => (
                <div key={a.id} className="glass p-4 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        {renderIcon(a.icon, "w-10 h-10 text-2xl")}
                        <div>
                            <p className="font-bold">{a.name}</p>
                            <p className={`text-xs font-bold ${a.type === ItemType.ADD ? 'text-green-600' : 'text-red-600'}`}>
                              {a.type === ItemType.ADD ? '加分' : '减分'} | {a.points} 分
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingAction(a)} className="p-2 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all">✏️</button>
                      <button onClick={() => setActions(actions.filter(x => x.id !== a.id))} className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all">移除</button>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 宝库库存管理 */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">💎 宝库库存管理</h2>
            <button 
                onClick={() => setEditingShopItem({ name: '', cost: 100, icon: '🎁', stock: 10 })}
                className="px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all text-white"
                style={{ backgroundColor: activeTheme.primary }}
            >+ 新商品</button>
        </div>

        {editingShopItem && (
          <div className="glass p-6 rounded-3xl border-2 space-y-4 animate-in slide-in-from-top-4 shadow-xl" style={{ borderColor: `${activeTheme.secondary}80` }}>
             <h3 className="text-lg font-bold">创建/编辑宝物</h3>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm opacity-60 font-bold">名称</label>
                    <input 
                      className="w-full bg-black/5 p-2 rounded-lg border border-slate-700/20 font-bold" 
                      value={editingShopItem.name} 
                      onChange={e => setEditingShopItem({...editingShopItem, name: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm opacity-60 font-bold">所需积分</label>
                    <input 
                      type="number"
                      className="w-full bg-black/5 p-2 rounded-lg border border-slate-700/20 font-bold" 
                      value={editingShopItem.cost} 
                      onChange={e => setEditingShopItem({...editingShopItem, cost: parseInt(e.target.value) || 0})}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm opacity-60 font-bold">初始库存</label>
                    <input 
                      type="number"
                      className="w-full bg-black/5 p-2 rounded-lg border border-slate-700/20 font-bold" 
                      value={editingShopItem.stock} 
                      onChange={e => setEditingShopItem({...editingShopItem, stock: parseInt(e.target.value) || 0})}
                    />
                </div>
             </div>
             
             <IconPicker selectedIcon={editingShopItem.icon || '🎁'} onSelect={icon => setEditingShopItem({...editingShopItem, icon})} />

             <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    if (editingShopItem.name) {
                        const newItem = { ...editingShopItem, id: editingShopItem.id || Date.now().toString() } as ShopItem;
                        setShopItems(prev => editingShopItem.id ? prev.map(s => s.id === editingShopItem.id ? newItem : s) : [...prev, newItem]);
                        setEditingShopItem(null);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: activeTheme.primary }}
                >保存</button>
                <button onClick={() => setEditingShopItem(null)} className="flex-1 py-3 bg-slate-600 rounded-xl font-bold text-white">取消</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shopItems.map(s => (
                <div key={s.id} className="glass p-4 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        {renderIcon(s.icon, "w-10 h-10 text-2xl")}
                        <div>
                            <p className="font-bold">{s.name}</p>
                            <p className="text-xs text-yellow-600 font-bold">{s.cost} 积分 | 库存: {s.stock}</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingShopItem(s)} className="p-2 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all">✏️</button>
                      <button onClick={() => setShopItems(shopItems.filter(x => x.id !== s.id))} className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all">移除</button>
                    </div>
                </div>
            ))}
        </div>
      </section>

      {/* 境界氛围管理 - 保持在设置页最后 */}
      <section className="space-y-4 pt-6 border-t border-slate-700/10">
        <h2 className="text-2xl font-bold flex items-center gap-2">✨ 境界氛围选择</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => setActiveTheme(theme)}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${activeTheme.id === theme.id ? 'scale-105 border-white shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}
              style={{ backgroundColor: theme.bg, borderColor: activeTheme.id === theme.id ? theme.primary : 'transparent', color: theme.text }}
            >
              <div className="w-8 h-8 rounded-full border border-black/10 shadow-sm" style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})` }}></div>
              <span className="text-xs font-bold whitespace-nowrap">{theme.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );

  const renderOracle = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
      <div className="relative">
         <div 
          className="w-40 h-40 rounded-full magical-glow transition-all duration-1000"
          style={{ 
            backgroundImage: `linear-gradient(to bottom right, ${activeTheme.primary}, ${activeTheme.secondary})`,
            animation: isOracleLoading ? 'pulse 2s infinite ease-in-out' : 'none',
            filter: isOracleLoading ? 'blur(8px) scale(1.1)' : 'none'
          }}
         ></div>
         <span className="absolute inset-0 flex items-center justify-center text-6xl">🔮</span>
      </div>
      <div className="max-w-xl glass p-8 rounded-[40px] relative shadow-lg">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase text-white shadow-sm" style={{ backgroundColor: activeTheme.primary }}>先知的启示</div>
        <p className="text-xl italic leading-relaxed opacity-90">
           {isOracleLoading ? "正在诵读咒语..." : `"${oracleMsg}"`}
        </p>
      </div>
      <button 
        onClick={askOracle}
        disabled={isOracleLoading}
        className="px-8 py-4 rounded-full font-bold magical-glow hover:scale-105 transition-all disabled:opacity-50 text-white shadow-xl"
        style={{ backgroundColor: activeTheme.primary }}
      >寻求指引</button>
      {!selectedUser && <p className="text-red-600 text-sm font-bold">请先在首页选择一位旅行者！</p>}
    </div>
  );

  const getViewTitle = () => {
    switch(view) {
      case 'HOME': return '荣耀王国';
      case 'USER_DETAILS': return selectedUser?.name || '旅行者详情';
      case 'SHOP': return '奇幻宝库';
      case 'ADMIN': return '秘法大厅';
      case 'ORACLE': return '占卜祭坛';
      case 'LEADERBOARD': return '荣耀巅峰榜';
      default: return '乐园';
    }
  }

  return (
    <Layout activeView={view} setView={setView} title={getViewTitle()} theme={activeTheme}>
      <div style={{ color: activeTheme.text }}>
        {updateAvailable && <UpdateBanner onUpdate={handleUpdateApp} />}
        {view === 'HOME' && renderHome()}
        {view === 'USER_DETAILS' && renderUserDetails()}
        {view === 'LEADERBOARD' && renderLeaderboard()}
        {view === 'SHOP' && renderShop()}
        {view === 'ADMIN' && renderAdmin()}
        {view === 'ORACLE' && renderOracle()}
      </div>

      {/* 自定义管理员验证弹窗 */}
      {passCallback && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass p-8 rounded-[40px] max-w-sm w-full border-2 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-300" style={{ borderColor: `${activeTheme.primary}4d`, color: activeTheme.text }}>
            <div className="text-4xl">🔐</div>
            <div>
              <h3 className="text-2xl font-bold fantasy-font">禁忌契约</h3>
              <p className="text-sm opacity-60 mt-2 font-bold">只有掌握秘法印记的人才能继续</p>
            </div>
            
            <div className="space-y-3">
              <input 
                type="password"
                placeholder="请输入秘语..."
                autoFocus
                className="w-full bg-black/5 border rounded-2xl px-5 py-4 text-center text-xl tracking-widest outline-none transition-all font-bold"
                style={{ borderColor: activeTheme.primary }}
                value={passInput}
                onChange={e => setPassInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePassSubmit()}
              />
              <button 
                onClick={() => setShowForgotHint(true)}
                className="text-xs opacity-60 hover:underline underline-offset-4 transition-colors font-bold"
                style={{ color: showForgotHint ? activeTheme.primary : '' }}
              >
                忘记秘语？
              </button>
              
              {showForgotHint && (
                <div className="p-3 rounded-xl border animate-in slide-in-from-top-2" style={{ backgroundColor: `${activeTheme.primary}1a`, borderColor: `${activeTheme.primary}33` }}>
                  <p className="text-xs font-bold">
                    古老的卷轴记载着：初始秘语为 <span className="font-bold text-yellow-600 px-1">123456</span>
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={handlePassSubmit}
                className="flex-1 py-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 text-white"
                style={{ backgroundColor: activeTheme.primary }}
              >
                契约成立
              </button>
              <button 
                onClick={() => setPassCallback(null)}
                className="flex-1 py-4 bg-slate-700 rounded-2xl font-bold hover:bg-slate-600 transition-all text-white/80"
              >
                终结仪式
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
