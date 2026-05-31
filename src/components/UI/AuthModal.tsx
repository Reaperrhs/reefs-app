import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, Check } from 'lucide-react';
import { useSavedReefs } from '../../hooks/useSavedReefs';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { login, register } = useSavedReefs();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        // Mock Auth API delay
        setSuccess(true);
        setTimeout(() => {
            if (isSignUp) {
                register(email);
            } else {
                login(email);
            }
            setSuccess(false);
            setEmail('');
            setPassword('');
            onClose();
        }, 1200);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative text-slate-200">
                
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white z-10 cursor-pointer"
                >
                    <X size={20} />
                </button>

                {success ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center min-h-[320px] animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                            <Check size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {isSignUp ? 'Account Created!' : 'Welcome Back!'}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {isSignUp ? 'Transferring session data to cloud sync...' : 'Loading your collections...'}
                        </p>
                    </div>
                ) : (
                    <div className="p-6">
                        {/* Tab Toggle */}
                        <div className="flex bg-slate-800/50 p-1 rounded-lg mb-6">
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(false); setError(''); }}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all cursor-pointer ${!isSignUp ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                <LogIn size={13} className="inline mr-1.5 -mt-0.5" /> Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(true); setError(''); }}
                                className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all cursor-pointer ${isSignUp ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                <UserPlus size={13} className="inline mr-1.5 -mt-0.5" /> Create Account
                            </button>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white tracking-tight">
                                {isSignUp ? 'Create a Reef Explorer Account' : 'Access Your Reefs'}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1">
                                {isSignUp 
                                    ? 'Unlock permanent cloud storage for your lists and favorites.' 
                                    : 'Log in to synchronize your collections across devices.'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 animate-shake">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-2 py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isSignUp ? (
                                    <>
                                        <UserPlus size={16} />
                                        <span>Sign Up & Sync Session</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={16} />
                                        <span>Log In</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
                
                {/* Informative Footer */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02] text-center text-[10px] text-slate-500">
                    Guest session data will automatically transfer to your account upon signing up.
                </div>
            </div>
        </div>
    );
};
