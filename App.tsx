
import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { User, View, PointAction, ShopItem, ItemType, PointHistory, Theme } from './types';
import { DEFAULT_ACTIONS, DEFAULT_SHOP_ITEMS, ADMIN_PASSWORD, MAGIC_ICONS, AVATAR_ICONS, THEMES } from './constants';
import { audioService } from './services/audioService';
import Layout from './components/Layout';

/**
 * 魔法数字滚动组件 - 优化动画清理
 */
const AnimatedNumber = memo(({ value, className }: { value: number, className?: string }) => {
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
      // Easing function: easeOutExpo
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
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <span className={className}>{displayValue}</span>;
});

/**
 * 图标渲染辅助组件 - 减少逻辑内联
 */
const DynamicIcon = memo(({ icon, className = "w-10 h-10" }: { icon: string, className?: string }) => {
  if (icon.startsWith('data:') || icon.startsWith('http')) {
    return <img src={icon} className={`${className} object-cover rounded-lg`} alt="icon" loading="lazy" />;
  }
  return <span className={className.replace('w-', 'text-')}>{icon}</span>;
});

/**
 * 紧凑型图标选择器组件
 */
const IconPicker = memo(({ 
  selectedIcon, 
  onSelect, 
  icons = MAGIC_ICONS, 
  label = "选择图标" 
}: { 
  selectedIcon: string, 
  onSelect: (icon: string) => void,
  icons?: string[],
  label?: string
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onSelect(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [onSelect]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold opacity-60 uppercase tracking-widest">{label}</label>
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded-full transition-colors text-white"
        >
          📁 上传本地
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>
      
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 h-24 overflow-y-auto p-1.5 border border-slate-700/20 rounded-xl bg-black/10">
        {icons.map(icon => (
          <button
            key={icon}
            type="button"
            onClick={() => onSelect(icon)}
            className={`text-xl p-1.5 rounded-lg transition-all ${selectedIcon === icon ? 'bg-purple-600 scale-105 text-white' : 'hover:bg-white/10'}`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
});

// --- 子视图组件优化 ---

const HomeView = memo(({ users, onSelectUser, activeTheme, onGoAdmin }: { 
  users: User[], 
  onSelectUser: (u: User) => void, 
  activeTheme: Theme,
  onGoAdmin: () => void
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
    {users.length === 0 ? (
      <div className="col-span-full text-center py-20 glass rounded-3xl">
        <p className="text-xl opacity-60">尚未有人加入乐园。</p>
        <button onClick={onGoAdmin} className="mt-6 px-8 py-3 rounded-full font-bold magical-glow transition-colors text-white" style={{ backgroundColor: activeTheme.primary }}>召唤旅行者</button>
      </div>
    ) : (
      users.map(u => (
        <div key={u.id} onClick={() => onSelectUser(u)} className="glass p-6 rounded-3xl cursor-pointer hover:scale-[1.02] transition-transform group relative overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-black/20 overflow-hidden flex items-center justify-center">
               <DynamicIcon icon={u.avatar} className="w-14 h-14 text-5xl" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{u.name}</h3>
              <p className="text-yellow-600 font-bold flex items-center gap-1">
                <span className="text-lg">✨</span> <AnimatedNumber value={u.points} /> <span> 积分</span>
              </p>
            </div>
          </div>
        </div>
      ))
    )}
  </div>
));

const LeaderboardView = memo(({ users }: { users: User[] }) => {
  const sortedUsers = useMemo(() => [...users].sort((a, b) => b.points - a.points), [users]);
  
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <h2 className="text-4xl font-bold fantasy-font tracking-tighter text-center text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, #fbbf24, #d97706)` }}>巅峰荣耀榜</h2>
      <div className="space-y-3">
        {sortedUsers.map((u, index) => (
          <div key={u.id} className="glass p-4 rounded-2xl border border-black/5 flex items-center justify-between hover:bg-black/5 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 flex items-center justify-center font-bold opacity-40">{index + 1}</div>
              <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center overflow-hidden"><DynamicIcon icon={u.avatar} className="w-8 h-8 text-2xl" /></div>
              <h3 className="font-bold text-lg">{u.name}</h3>
            </div>
            <p className="text-2xl font-black text-yellow-600"><AnimatedNumber value={u.points} /></p>
          </div>
        ))}
      </div>
    </div>
  );
});

const UserDetailView = memo(({ user, actions, onAction, activeTheme, onBack }: { 
  user: User, 
  actions: PointAction[], 
  onAction: (a: PointAction) => void, 
  activeTheme: Theme,
  onBack: () => void
}) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
    <button onClick={onBack} className="opacity-60 hover:opacity-100 flex items-center gap-2 font-bold transition-opacity">← 返回首页</button>
    <div className="glass p-8 rounded-[40px] flex flex-col md:flex-row gap-8 items-center md:items-start">
      <div className="w-32 h-32 rounded-3xl bg-black/20 border-4 flex items-center justify-center overflow-hidden" style={{ borderColor: `${activeTheme.primary}4d` }}><DynamicIcon icon={user.avatar} className="w-24 h-24 text-7xl" /></div>
      <div>
        <h2 className="text-4xl font-bold fantasy-font">{user.name}</h2>
        <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 text-yellow-700 px-6 py-2 rounded-full border border-yellow-500/30">
          <span className="text-2xl font-bold"><AnimatedNumber value={user.points} /></span>
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">当前积分</span>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">法则操作</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map(a => (
            <button key={a.id} onClick={() => onAction(a)} className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${a.type === ItemType.ADD ? 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10' : 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'}`}>
              <DynamicIcon icon={a.icon} className="w-10 h-10 text-3xl" />
              <span className="text-xs font-bold uppercase truncate w-full text-center">{a.name}</span>
              <span className={`text-sm font-bold ${a.type === ItemType.ADD ? 'text-green-600' : 'text-red-600'}`}>{a.type === ItemType.ADD ? '+' : '-'}{a.points}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="glass rounded-[32px] overflow-hidden">
        <h3 className="p-5 font-bold border-b border-black/5">📜 历史卷轴</h3>
        <div className="max-h-[400px] overflow-y-auto">
          {user.history.map((h) => (
            <div key={h.id} className="p-4 border-b border-black/5 flex justify-between items-center">
              <div><p className="font-bold text-sm">{h.actionName}</p><p className="text-[10px] opacity-40">{new Date(h.timestamp).toLocaleString()}</p></div>
              <div className={`px-3 py-1 rounded-full text-xs font-black ${h.points >= 0 ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>{h.points >= 0 ? '+' : ''}{h.points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

// --- 主应用组件 ---

const App: React.FC = () => {
  const [view, setView] = useState<View>('HOME');
  const [users, setUsers] = useState<User[]>([]);
  const [actions, setActions] = useState<PointAction[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTheme, setActiveTheme] = useState<Theme>(THEMES[0]);
  
  const [editingAction, setEditingAction] = useState<Partial<PointAction> | null>(null);
  const [editingShopItem, setEditingShopItem] = useState<Partial<ShopItem> | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [passCallback, setPassCallback] = useState<{ execute: () => void } | null>(null);
  const [passInput, setPassInput] = useState('');

  // 禁止滚动穿透逻辑
  useEffect(() => {
    const isModalOpen = !!editingAction || !!editingShopItem || !!passCallback;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [editingAction, editingShopItem, passCallback]);

  // 数据初始化
  useEffect(() => {
    const loadData = () => {
      try {
        const savedUsers = localStorage.getItem('fp_users');
        const savedActions = localStorage.getItem('fp_actions');
        const savedShop = localStorage.getItem('fp_shop');
        const savedThemeId = localStorage.getItem('fp_theme_id');

        if (savedUsers) setUsers(JSON.parse(savedUsers));
        setActions(savedActions ? JSON.parse(savedActions) : DEFAULT_ACTIONS);
        setShopItems(savedShop ? JSON.parse(savedShop) : DEFAULT_SHOP_ITEMS);
        
        if (savedThemeId) {
          const theme = THEMES.find(t => t.id === savedThemeId);
          if (theme) setActiveTheme(theme);
        }
      } catch (e) {
        console.error("Failed to load persistence data", e);
      }
    };
    loadData();
  }, []);

  // 数据持久化
  useEffect(() => { if (users.length > 0) localStorage.setItem('fp_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { if (actions.length > 0) localStorage.setItem('fp_actions', JSON.stringify(actions)); }, [actions]);
  useEffect(() => { if (shopItems.length > 0) localStorage.setItem('fp_shop', JSON.stringify(shopItems)); }, [shopItems]);
  useEffect(() => localStorage.setItem('fp_theme_id', activeTheme.id), [activeTheme]);

  // 稳定回调函数
  const verifyPass = useCallback((action: () => void) => {
    setPassCallback({ execute: action });
    setPassInput('');
  }, []);

  const handlePassSubmit = useCallback(() => {
    if (passInput === ADMIN_PASSWORD) {
      if (passCallback) passCallback.execute();
      setPassCallback(null);
    } else {
      audioService.playFail();
      alert('密码错误。');
    }
  }, [passInput, passCallback]);

  const handleAddUser = useCallback((userData: Partial<User>) => {
    if (!userData.name) {
      alert('请输入尊名');
      return;
    }
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      avatar: userData.avatar || AVATAR_ICONS[0],
      points: userData.points || 0,
      history: []
    };
    setUsers(prev => [...prev, newUser]);
    setIsAddingUser(false);
    setEditingUser(null);
    audioService.playMagic();
  }, []);

  const handleAction = useCallback((action: PointAction) => {
    if (!selectedUser) return;
    
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

    setUsers(prev => prev.map(u => u.id === selectedUser.id ? {
      ...u,
      points: Math.max(0, u.points + change),
      history: [newHistory, ...u.history].slice(0, 50)
    } : u));
  }, [selectedUser]);

  // 更新选中用户引用的逻辑
  useEffect(() => {
    if (selectedUser) {
      const updated = users.find(u => u.id === selectedUser.id);
      if (updated) setSelectedUser(updated);
    }
  }, [users, selectedUser?.id]);

  const handleBuy = useCallback((item: ShopItem) => {
    if (!selectedUser) return;
    if (selectedUser.points < item.cost) {
      audioService.playFail();
      alert('积分不足！');
      return;
    }
    if (item.stock <= 0) {
      alert('库存不足！');
      return;
    }

    audioService.playMagic();
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? {
      ...u,
      points: u.points - item.cost,
      history: [{
        id: Date.now().toString(),
        actionId: item.id,
        actionName: `购买了 ${item.name}`,
        points: -item.cost,
        timestamp: Date.now()
      }, ...u.history]
    } : u));
    setShopItems(prev => prev.map(si => si.id === item.id ? { ...si, stock: si.stock - 1 } : si));
  }, [selectedUser]);

  const handleSelectUser = useCallback((u: User) => {
    setSelectedUser(u);
    setView('USER_DETAILS');
  }, []);

  const handleGoHome = useCallback(() => setView('HOME'), []);
  const handleGoAdmin = useCallback(() => setView('ADMIN'), []);

  return (
    <Layout activeView={view} setView={setView} title={view === 'ADMIN' ? '秘法大厅' : view === 'SHOP' ? '奇幻宝库' : '荣耀王国'} theme={activeTheme}>
      <div style={{ color: activeTheme.text }}>
        {view === 'HOME' && <HomeView users={users} onSelectUser={handleSelectUser} activeTheme={activeTheme} onGoAdmin={handleGoAdmin} />}
        
        {view === 'USER_DETAILS' && selectedUser && (
          <UserDetailView user={selectedUser} actions={actions} onAction={handleAction} activeTheme={activeTheme} onBack={handleGoHome} />
        )}
        
        {view === 'LEADERBOARD' && <LeaderboardView users={users} />}
        
        {view === 'SHOP' && (
            <div className="space-y-8 animate-in fade-in pb-20">
                <h2 className="text-3xl font-bold fantasy-font">奇幻宝库</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shopItems.map(item => (
                        <div key={item.id} className="glass p-6 rounded-3xl flex flex-col items-center gap-4">
                            <DynamicIcon icon={item.icon} className="w-16 h-16 text-5xl" />
                            <div className="text-center"><h3 className="text-xl font-bold">{item.name}</h3><p className="opacity-40 text-xs">库存: {item.stock}</p></div>
                            <button 
                              disabled={!selectedUser || item.stock <= 0 || selectedUser.points < item.cost} 
                              onClick={() => handleBuy(item)} 
                              className="w-full py-3 rounded-2xl font-bold text-white disabled:opacity-30 transition-all active:scale-95" 
                              style={{ backgroundColor: activeTheme.primary }}
                            >
                              {item.cost} 积分兑换
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {view === 'ADMIN' && (
          <div className="space-y-12 animate-in fade-in duration-500 pb-24">
            {/* 居民管理 */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold">🧙 居民管理</h2>
                 <button onClick={() => setIsAddingUser(true)} className="px-4 py-2 rounded-xl font-bold text-white" style={{ backgroundColor: activeTheme.primary }}>+ 召唤</button>
              </div>
              {(isAddingUser || editingUser) && (
                <div className="glass p-6 rounded-3xl border-2 space-y-4" style={{ borderColor: `${activeTheme.primary}80` }}>
                  <h3 className="font-bold">修改居民</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input className="bg-black/5 p-3 rounded-xl outline-none" placeholder="尊名" value={editingUser?.name || ''} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                    <input type="number" className="bg-black/5 p-3 rounded-xl outline-none" placeholder="积分" value={editingUser?.points || 0} onChange={e => setEditingUser({...editingUser, points: parseInt(e.target.value) || 0})} />
                  </div>
                  <IconPicker label="选择外观" icons={AVATAR_ICONS} selectedIcon={editingUser?.avatar || '🧙‍♂️'} onSelect={icon => setEditingUser({...editingUser, avatar: icon})} />
                  <div className="flex gap-2">
                    <button onClick={() => { editingUser?.id ? verifyPass(() => { setUsers(users.map(u => u.id === editingUser.id ? (editingUser as User) : u)); setEditingUser(null); }) : handleAddUser(editingUser || {}); }} className="flex-1 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: activeTheme.primary }}>保存</button>
                    <button onClick={() => { setEditingUser(null); setIsAddingUser(false); }} className="flex-1 py-3 bg-slate-600 rounded-xl text-white font-bold">取消</button>
                  </div>
                </div>
              )}
              <div className="glass rounded-3xl overflow-hidden divide-y divide-black/5">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3"><DynamicIcon icon={u.avatar} className="w-8 h-8 text-2xl" /><p className="font-bold">{u.name}</p></div>
                    <div className="flex gap-1"><button onClick={() => setEditingUser({...u})} className="p-2 hover:bg-black/10 rounded-lg">✏️</button><button onClick={() => verifyPass(() => setUsers(users.filter(x => x.id !== u.id)))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">🗑️</button></div>
                  </div>
                ))}
              </div>
            </section>

            {/* 积分法则列表 */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">📖 积分法则</h2>
                  <button onClick={() => setEditingAction({ name: '', points: 10, type: ItemType.ADD, icon: '✨' })} className="px-4 py-2 rounded-xl font-bold text-white" style={{ backgroundColor: activeTheme.primary }}>+ 撰写</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                      <h4 className="text-green-600 font-bold text-[10px] uppercase tracking-widest ml-2">荣耀 (ADD)</h4>
                      <div className="space-y-2">
                          {actions.filter(a => a.type === ItemType.ADD).map(a => (
                              <div key={a.id} className="glass p-3 rounded-2xl flex items-center justify-between border-l-4 border-green-500/30">
                                  <div className="flex items-center gap-3"><DynamicIcon icon={a.icon} className="w-6 h-6 text-xl" /><p className="font-bold text-sm">{a.name} <span className="text-green-600">+{a.points}</span></p></div>
                                  <button onClick={() => setEditingAction({...a})} className="p-2 hover:bg-black/10 rounded-lg">✏️</button>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="space-y-2">
                      <h4 className="text-red-600 font-bold text-[10px] uppercase tracking-widest ml-2">惩戒 (SUB)</h4>
                      <div className="space-y-2">
                          {actions.filter(a => a.type === ItemType.SUBTRACT).map(a => (
                              <div key={a.id} className="glass p-3 rounded-2xl flex items-center justify-between border-l-4 border-red-500/30">
                                  <div className="flex items-center gap-3"><DynamicIcon icon={a.icon} className="w-6 h-6 text-xl" /><p className="font-bold text-sm">{a.name} <span className="text-red-600">-{a.points}</span></p></div>
                                  <button onClick={() => setEditingAction({...a})} className="p-2 hover:bg-black/10 rounded-lg">✏️</button>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
            </section>

            {/* 宝库库存 */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">💎 宝库库存</h2>
                  <button onClick={() => setEditingShopItem({ name: '', cost: 100, icon: '🎁', stock: 10 })} className="px-4 py-2 rounded-xl font-bold text-white" style={{ backgroundColor: activeTheme.primary }}>+ 供奉</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shopItems.map(s => (
                      <div key={s.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-yellow-500/10">
                          <div className="flex items-center gap-3">
                              <DynamicIcon icon={s.icon} className="w-8 h-8 text-2xl" />
                              <div><p className="font-bold text-sm">{s.name}</p><p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest">{s.cost} ✨ | {s.stock}件</p></div>
                          </div>
                          <button onClick={() => setEditingShopItem({...s})} className="p-2 hover:bg-black/10 rounded-lg">✏️</button>
                      </div>
                  ))}
              </div>
            </section>

            {/* 境界氛围 */}
            <section className="space-y-4 pt-6 border-t border-slate-700/10">
              <h2 className="text-2xl font-bold">🌈 境界氛围选择</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-4">
                {THEMES.map(theme => (
                  <button 
                    key={theme.id} 
                    onClick={() => setActiveTheme(theme)} 
                    className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${activeTheme.id === theme.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`} 
                    style={{ backgroundColor: theme.bg, color: theme.text, borderColor: activeTheme.id === theme.id ? theme.primary : 'transparent' }}
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-white/20" style={{ background: theme.primary }}></div>
                    <span className="text-[10px] font-black uppercase tracking-tighter truncate w-full text-center">{theme.name}</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* 弹窗部分 */}
      {editingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setEditingAction(null)}></div>
          <div className="relative glass p-4 sm:p-5 rounded-[2.5rem] max-w-md w-full border-2 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[85vh]" 
               style={{ borderColor: `${activeTheme.primary}cc`, backgroundImage: `linear-gradient(135deg, ${activeTheme.bg}dd, rgba(147, 51, 234, 0.05))` }}>
             <div className="text-center mb-2 shrink-0"><span className="text-2xl block">📖</span><h3 className="text-lg font-bold fantasy-font tracking-widest uppercase">法则配置</h3></div>
             <div className="space-y-2 overflow-y-auto px-1 pb-2 flex-1 scrollbar-thin">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold opacity-60 ml-2 uppercase tracking-widest">名称</label>
                  <input className="w-full bg-black/20 p-2.5 rounded-2xl outline-none border border-white/5 focus:border-purple-500 transition-colors font-bold text-sm" value={editingAction.name} onChange={e => setEditingAction({...editingAction, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold opacity-60 ml-2 uppercase tracking-widest">属性</label>
                    <div className="flex bg-black/20 rounded-2xl p-1">
                       <button onClick={() => setEditingAction({...editingAction, type: ItemType.ADD})} className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold ${editingAction.type === ItemType.ADD ? 'bg-green-600 text-white' : 'opacity-40'}`}>荣耀 (+)</button>
                       <button onClick={() => setEditingAction({...editingAction, type: ItemType.SUBTRACT})} className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold ${editingAction.type === ItemType.SUBTRACT ? 'bg-red-600 text-white' : 'opacity-40'}`}>惩戒 (-)</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold opacity-60 ml-2 uppercase tracking-widest">分值</label>
                    <input type="number" className="w-full bg-black/20 p-2 rounded-2xl outline-none border border-white/5 font-bold text-center text-sm" value={editingAction.points} onChange={e => setEditingAction({...editingAction, points: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <IconPicker selectedIcon={editingAction.icon || '✨'} onSelect={icon => setEditingAction({...editingAction, icon})} />
             </div>
             <div className="flex gap-2 pt-3 shrink-0">
                <button onClick={() => { if (editingAction.name) { setActions(prev => editingAction.id ? prev.map(a => a.id === editingAction.id ? (editingAction as PointAction) : a) : [...prev, { ...editingAction, id: Date.now().toString() } as PointAction]); setEditingAction(null); audioService.playMagic(); } }} className="flex-[2] py-2.5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 text-xs uppercase" style={{ backgroundColor: activeTheme.primary }}>保存</button>
                <button onClick={() => setEditingAction(null)} className="flex-1 py-2.5 bg-slate-800 rounded-2xl font-bold text-white text-[10px] uppercase">取消</button>
             </div>
          </div>
        </div>
      )}

      {editingShopItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setEditingShopItem(null)}></div>
          <div className="relative glass p-4 sm:p-5 rounded-[2.5rem] max-w-md w-full border-2 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[85vh]" 
               style={{ borderColor: `#fbbf24cc`, backgroundImage: `linear-gradient(135deg, ${activeTheme.bg}ee, rgba(251, 191, 36, 0.05))` }}>
             <div className="text-center mb-2 shrink-0"><span className="text-2xl block">💎</span><h3 className="text-lg font-bold fantasy-font tracking-widest uppercase text-yellow-500">藏品配置</h3></div>
             <div className="space-y-2 overflow-y-auto px-1 pb-2 flex-1 scrollbar-thin">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold opacity-60 ml-2 uppercase tracking-widest">藏品称谓</label>
                  <input className="w-full bg-black/40 p-2.5 rounded-2xl outline-none border border-yellow-500/20 focus:border-yellow-500 transition-colors font-bold text-sm text-yellow-100" value={editingShopItem.name || ''} onChange={e => setEditingShopItem({...editingShopItem, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold opacity-60 ml-2 uppercase tracking-widest">售价</label>
                     <input type="number" className="w-full bg-black/40 p-2 rounded-2xl outline-none border border-yellow-500/20 font-black text-center text-yellow-500 text-sm" value={editingShopItem.cost || 0} onChange={e => setEditingShopItem({...editingShopItem, cost: parseInt(e.target.value) || 0})} />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-bold opacity-60 ml-2 uppercase tracking-widest">库存</label>
                     <input type="number" className="w-full bg-black/40 p-2 rounded-2xl outline-none border border-yellow-500/20 font-black text-center text-sm" value={editingShopItem.stock || 0} onChange={e => setEditingShopItem({...editingShopItem, stock: parseInt(e.target.value) || 0})} />
                   </div>
                </div>
                <IconPicker selectedIcon={editingShopItem.icon || '🎁'} onSelect={icon => setEditingShopItem({...editingShopItem, icon})} />
             </div>
             <div className="flex gap-2 pt-3 shrink-0">
                <button onClick={() => { if (editingShopItem.name) { setShopItems(prev => editingShopItem.id ? prev.map(s => s.id === editingShopItem.id ? (editingShopItem as ShopItem) : s) : [...prev, { ...editingShopItem, id: Date.now().toString() } as ShopItem]); setEditingShopItem(null); audioService.playCoin(); } }} className="flex-[2] py-2.5 rounded-2xl font-black text-slate-900 shadow-xl transition-all active:scale-95 text-xs uppercase bg-gradient-to-r from-yellow-400 to-amber-600">入库</button>
                <button onClick={() => setEditingShopItem(null)} className="flex-1 py-2.5 bg-slate-800 rounded-2xl font-bold text-white text-[10px] uppercase">取消</button>
             </div>
          </div>
        </div>
      )}

      {passCallback && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass p-8 rounded-[40px] max-w-sm w-full border-2 text-center space-y-6 shadow-2xl" style={{ borderColor: activeTheme.primary }}>
            <h3 className="text-xl font-bold uppercase tracking-widest">身份校验</h3>
            <input type="password" placeholder="秘令..." autoFocus className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-4 text-center text-xl tracking-[0.5em] outline-none font-black" style={{ color: activeTheme.primary }} value={passInput} onChange={e => setPassInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePassSubmit()} />
            <div className="flex gap-3">
              <button onClick={handlePassSubmit} className="flex-1 py-3 rounded-xl font-black text-white text-xs uppercase transition-all active:scale-95" style={{ backgroundColor: activeTheme.primary }}>确立</button>
              <button onClick={() => setPassCallback(null)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-white text-xs uppercase transition-all active:scale-95">作罢</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default memo(App);
