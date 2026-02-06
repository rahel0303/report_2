import React, { useState, useEffect } from 'react';
import { MonitorPlay, CheckCircle2, LogOut, User, Loader2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserInfo {
  id: number;
  name: string;
  username: string;
  role: string;
}

interface AppHeaderProps {
  currentStep: 'setup' | 'review' | 'edit_cover' | 'edit_generic' | 'design_cover';
}

export const AppHeader: React.FC<AppHeaderProps> = ({ currentStep }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    // Fetch current user info
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm h-16">
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white p-1.5 rounded-lg">
            <MonitorPlay size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            AutoReport <span className="text-slate-400 font-normal">Generator</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save indicator */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            <CheckCircle2 size={12} />
            <span className="font-medium">Auto-saved</span>
          </div>

          {currentStep === 'setup' && (
            <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
              Step 1: Setup
            </span>
          )}
          {currentStep === 'review' && (
            <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
              Step 2: Review
            </span>
          )}
          {currentStep.startsWith('edit') && (
            <span className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs font-bold">
              Step 3: Editing
            </span>
          )}

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <User size={16} className="text-slate-600" />
              </div>
              {user && <span className="text-sm font-medium text-slate-700">{user.name}</span>}
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  {user && (
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">@{user.username}</p>
                      {user.role === 'admin' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  )}
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings size={16} />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoggingOut ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <LogOut size={16} />
                    )}
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
