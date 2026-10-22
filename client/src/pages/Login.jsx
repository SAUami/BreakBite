import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Lock, Mail, User, ShieldCheck, ArrowRight, Sparkles, GraduationCap, ChefHat, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login({ onSuccess }) {
  const { login, register, quickDemoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        await register({ name, email, password, role, studentId });
      } else {
        await login(email, password);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoRole) => {
    setLoading(true);
    setError('');
    try {
      await quickDemoLogin(demoRole);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hackathon Judge Fast-Pass Box */}
        <div className="mb-4 bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-4 text-white shadow-lg shadow-orange-500/25">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black tracking-wider uppercase text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Hackathon Judge Fast-Pass</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">1-Click Login</span>
          </div>
          <p className="text-xs text-orange-100 leading-relaxed mb-3">
            Switch between Student ordering and Live Canteen Kitchen view instantly:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDemoClick('student')}
              className="bg-white text-orange-900 rounded-2xl p-2.5 text-left text-xs font-bold hover:bg-orange-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="font-extrabold truncate">Student Mode</div>
                <div className="text-[10px] text-slate-500 truncate">Aarav Sharma</div>
              </div>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleDemoClick('canteen')}
              className="bg-slate-900 text-white rounded-2xl p-2.5 text-left text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                <ChefHat className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="font-extrabold truncate">Canteen Staff</div>
                <div className="text-[10px] text-amber-300 truncate">Kitchen Admin</div>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Regular Login / Signup Form */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md">
              <span className="text-xl">🍱</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Break<span className="text-orange-600">Bite</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Digital Canteen & Bell-Sync Ordering</p>
            </div>
          </div>

          {/* Form Mode Toggle */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                        role === 'student'
                          ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-xs'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      🎓 Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('canteen')}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition-all ${
                        role === 'canteen'
                          ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-xs'
                          : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      👨‍🍳 Canteen Staff
                    </button>
                  </div>
                </div>

                {role === 'student' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Student / Roll ID</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. GIIT-2024-CS081"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Campus Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@demo.com or student@giit.ac.in"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Complete Registration' : 'Log In to Canteen'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
