import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, MessageSquareShare, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed. Please check your credentials.');
                setLoading(false);
                return;
            }

            // Store in context (which also persists to localStorage)
            login(data.user, data.token);
            navigate('/dashboard');
        } catch (err) {
            setError('Unable to connect to the server. Please try again later.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111B21] p-4 relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-10 w-72 h-72 bg-[#25D366] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob"></div>
            <div className="absolute top-0 right-10 w-72 h-72 bg-[#128C7E] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-[#34B7F1] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob animation-delay-4000"></div>

            <Card className="w-full max-w-md border-[#2A3942] bg-[#202C33]/90 backdrop-blur-xl shadow-2xl relative z-10 text-slate-100">
                <CardHeader className="space-y-3">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                            <MessageSquareShare className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-center tracking-tight bg-gradient-to-r from-[#25D366] to-[#51c482] bg-clip-text text-transparent">
                        Welcome to BulkNode
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Sign in to access your WhatsApp CRM & Broadcaster
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-[#111B21] border-[#2A3942] text-white placeholder:text-slate-500 focus-visible:ring-[#25D366]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <span className="text-sm font-medium text-slate-500 mb-0.5 cursor-not-allowed">
                                    Forgot password?
                                </span>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-[#111B21] border-[#2A3942] text-white placeholder:text-slate-500 focus-visible:ring-[#25D366]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="securityCheck"
                                        name="securityCheck"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-[#2A3942] bg-[#111B21] text-[#25D366] focus:ring-[#25D366] focus:ring-offset-[#202C33] transition duration-200 cursor-pointer"
                                        required
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <Label htmlFor="securityCheck" className="text-slate-300 flex items-center gap-2 cursor-pointer transition-colors hover:text-white">
                                        <ShieldCheck className="w-4 h-4 text-[#25D366]" />
                                        I am human (Security Check)
                                    </Label>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-bold border-0 shadow-lg shadow-[#25D366]/20 transition-all duration-300 h-11 text-md disabled:opacity-70"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing In...</>
                            ) : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex justify-center pb-8 border-t border-[#2A3942]/50 pt-4 mt-2">
                    <p className="text-sm text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-[#25D366] hover:text-[#51c482] transition-colors">
                            Create one now
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
