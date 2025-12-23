
import React, { useLayoutEffect, memo } from 'react';
import { View, Theme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: View;
  setView: (view: View) => void;
  title?: string;
  theme: Theme;
}

const NavButton = memo(({ icon, label, active, onClick, theme }: { 
  icon: string, 
  label: string, 
  active: boolean, 
  onClick: () => void, 
  theme: Theme 
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${active ? 'magical-glow scale-110' : 'hover:bg-white/10'}`}
    style={{ backgroundColor: active ? theme.primary : 'transparent' }}
  >
    <span className="text-2xl">{icon}</span>
    <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">{label}</span>
  </button>
));

const Layout: React.FC<LayoutProps> = ({ children, activeView, setView, title = "乐园", theme }) => {
  
  useLayoutEffect(() => {
    const root = document.documentElement;
    // 使用 requestAnimationFrame 确保在下一帧批量更新样式变量
    requestAnimationFrame(() => {
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--secondary', theme.secondary);
      root.style.setProperty('--bg', theme.bg);
      root.style.setProperty('--glass', theme.glass);
      root.style.setProperty('--glow', theme.glow);
      root.style.setProperty('--text', theme.text);
    });
  }, [theme]);

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pl-20 relative overflow-x-hidden theme-transition">
      {/* Background Decor - 使用 will-change 优化位移动画性能 */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden" style={{ willChange: 'transform' }}>
        <div 
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[120px] transition-all duration-1000"
          style={{ backgroundColor: theme.primary }}
        ></div>
        <div 
          className="absolute top-1/2 -right-24 w-80 h-80 rounded-full blur-[100px] transition-all duration-1000"
          style={{ backgroundColor: theme.secondary }}
        ></div>
        <div 
          className="absolute -bottom-24 left-1/3 w-96 h-96 rounded-full blur-[120px] transition-all duration-1000"
          style={{ backgroundColor: theme.primary }}
        ></div>
      </div>

      <header className="p-6 md:p-8 flex justify-between items-center relative z-10">
        <h1 
          className="text-3xl font-bold fantasy-font tracking-widest text-transparent bg-clip-text transition-all duration-500"
          style={{ backgroundImage: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
        >
          {title}
        </h1>
      </header>

      <main className="p-4 md:p-8 max-w-6xl mx-auto relative z-10">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass h-20 flex justify-around items-center px-4 md:h-screen md:w-20 md:flex-col md:top-0 md:bottom-auto z-50">
        <NavButton icon="🏰" label="首页" active={activeView === 'HOME' || activeView === 'USER_DETAILS'} onClick={() => setView('HOME')} theme={theme} />
        <NavButton icon="🏆" label="排行" active={activeView === 'LEADERBOARD'} onClick={() => setView('LEADERBOARD')} theme={theme} />
        <NavButton icon="💎" label="商店" active={activeView === 'SHOP'} onClick={() => setView('SHOP')} theme={theme} />
        <NavButton icon="⚙️" label="管理" active={activeView === 'ADMIN'} onClick={() => setView('ADMIN')} theme={theme} />
      </nav>
    </div>
  );
};

export default memo(Layout);
