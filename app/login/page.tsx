'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [registerForm, setRegisterForm] = useState({ name: '', username: '', password: '', confirmPassword: '' });
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => { if (r.ok) router.replace('/home'); })
      .catch(() => {});
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm({ ...registerForm, [name]: value });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          username: registerForm.username,
          password: registerForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      setRegisterSuccess(true);
      setRegisterForm({ name: '', username: '', password: '', confirmPassword: '' });
      setTimeout(() => {
        setRegisterSuccess(false);
        setMode('login');
      }, 3000);
    } catch (err: unknown) {
      setRegisterError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      router.push(data.user?.role === 'admin' ? '/admin' : '/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">

      {/* Left side - Photo */}
      <div className="hidden lg:flex lg:w-1/2 items-stretch">
        <div
          className="relative w-full overflow-hidden"
          style={{
            borderRadius: '0 3rem 3rem 0',
            boxShadow: '16px 0 48px 8px rgba(0,0,0,0.5)',
            backgroundImage:
              "url('https://images.unsplash.com/photo-1551836022-4c4c79ecde51?q=80&w=1920&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/55"></div>
          <div className="absolute inset-0 flex flex-col justify-center px-12 xl:px-16 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 mb-4">
              Social Media Analytics
            </p>
            <h2 className="text-5xl xl:text-6xl font-black uppercase leading-tight tracking-tight mb-6">
              TURN DATA
              <br />
              <span className="text-white/40">INTO</span>
              <br />
              STORIES.
            </h2>
            <p className="text-lg font-semibold text-white/80 uppercase tracking-wide mb-2">
              Build Reports That Inspire Action
            </p>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Visualize performance, track growth, and present results with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3 leading-tight uppercase tracking-wide">
              {mode === 'login' ? (
                <>YOUR GATEWAY TO<br />POWERFUL REPORTS</>
              ) : (
                <>CREATE YOUR<br />ACCOUNT</>
              )}
            </h1>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              {mode === 'login'
                ? 'Log in to access your report dashboard and start building insightful social media reports.'
                : 'Register a new account. An admin will verify your account before you can log in.'}
            </p>
          </div>

          {mode === 'login' ? (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-gray-900 text-sm font-bold mb-2 block">Username</label>
                  <input
                    name="email"
                    onChange={handleChange}
                    value={form.email}
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-gray-900"
                    placeholder="Input username"
                  />
                </div>

                <div>
                  <label className="text-gray-900 text-sm font-bold mb-2 block">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      onChange={handleChange}
                      value={form.password}
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-gray-900"
                      placeholder="••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 cursor-pointer bg-green-800 hover:bg-green-900 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    'Log In - Start Building Reports'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-green-800 font-semibold hover:underline"
                >
                  Register
                </button>
              </p>
            </>
          ) : (
            <>
              {registerSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
                  Registration successful! Please wait for admin verification before logging in.
                </div>
              )}

              {registerError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                  {registerError}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                <div>
                  <label className="text-gray-900 text-sm font-bold mb-2 block">Name</label>
                  <input
                    name="name"
                    onChange={handleRegisterChange}
                    value={registerForm.name}
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-gray-900"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="text-gray-900 text-sm font-bold mb-2 block">Username</label>
                  <input
                    name="username"
                    onChange={handleRegisterChange}
                    value={registerForm.username}
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-gray-900"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label className="text-gray-900 text-sm font-bold mb-2 block">Password</label>
                  <input
                    name="password"
                    onChange={handleRegisterChange}
                    value={registerForm.password}
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-gray-900"
                    placeholder="••••••••••"
                  />
                </div>

                <div>
                  <label className="text-gray-900 text-sm font-bold mb-2 block">Confirm Password</label>
                  <input
                    name="confirmPassword"
                    onChange={handleRegisterChange}
                    value={registerForm.confirmPassword}
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white text-gray-900"
                    placeholder="••••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 cursor-pointer bg-green-800 hover:bg-green-900 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setRegisterError(''); setRegisterSuccess(false); }}
                  className="text-green-800 font-semibold hover:underline"
                >
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );

}
