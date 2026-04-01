'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Wifi,
  PresentationIcon,
  ChevronRight,
  Settings,
  LogOut,
  X,
  Menu,
} from 'lucide-react';

interface SessionUser {
  id: number;
  name: string;
  role: string;
  is_verified: boolean;
}

interface AppSidebarProps {
  /** 'push' = sidebar geser konten (legacy). 'overlay' = sidebar tumpuk konten */
  mode?: 'push' | 'overlay';
}

export function AppSidebar({ mode = 'overlay' }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_open');
    setOpen(saved === 'true');
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_open', String(next));
      return next;
    });
  };

  const close = () => {
    setOpen(false);
    localStorage.setItem('sidebar_open', 'false');
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => { if (d?.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: null, label: 'AutoConnect', icon: Wifi, soon: true },
    { href: '/', label: 'Auto Report', icon: PresentationIcon },
  ];

  const activeHref = pathname === '/' ? '/' : pathname;

  return (
    <>
      {/* ── Mini bar (collapsed state) ── */}
      {!open && (
        <div className="fixed top-0 left-0 h-full w-14 flex flex-col bg-white border-r border-slate-200 shadow-sm z-40">
          {/* Hamburger expand button */}
          <div className="h-16 flex items-center justify-center border-b border-slate-100 shrink-0">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Expand sidebar"
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Nav icons */}
          <nav className="flex-1 flex flex-col items-center py-4 gap-1">
            {navItems.map(({ href, label, icon: Icon, soon }) => {
              const isActive = href !== null && activeHref === href;
              return (
                <button
                  key={label}
                  onClick={() => {
                    if (soon || !href) return;
                    router.push(href);
                  }}
                  title={label}
                  className={`p-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-600'
                      : soon
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </nav>

          {/* Bottom: expand chevron + avatar */}
          <div className="flex flex-col items-center py-4 gap-3 border-t border-slate-100 shrink-0">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </div>
      )}

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
          onClick={close}
        />
      )}

      {/* ── Full sidebar (overlay) ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 flex flex-col bg-white border-r border-slate-200 shadow-lg z-50
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo + close btn */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
          <img src="/auometric-logo-long.png" alt="AutoMetric" className="h-25 w-auto object-contain" />
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon, soon }) => {
            const isActive = href !== null && activeHref === href;
            return (
              <button
                key={label}
                onClick={() => {
                  if (soon || !href) return;
                  router.push(href);
                  close();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left group
                  ${isActive
                    ? 'bg-teal-50 text-teal-700 border border-teal-200'
                    : soon
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <Icon size={17} className={isActive ? 'text-teal-600' : soon ? 'text-slate-300' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="flex-1 whitespace-nowrap">{label}</span>
                {soon && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-400 tracking-wide">
                    SOON
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-teal-400" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-slate-100 flex flex-col gap-1 shrink-0">
          {user?.role === 'admin' && (
            <button
              onClick={() => { router.push('/admin'); close(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Settings size={15} />
              Admin Panel
            </button>
          )}
          <div className="px-3 py-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.name ?? '...'}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role ?? ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
