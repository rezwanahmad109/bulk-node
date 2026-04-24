import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, User, MessageSquareShare, Building2, Briefcase, Globe, Check, ChevronsUpDown, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import countryList from 'country-list';
import { useAuth } from '@/context/AuthContext';

const countries = countryList.getData();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function Register() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [open, setOpen] = useState(false);
    const [country, setCountry] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match. Please try again.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, businessName, businessType, country, password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed. Please try again.');
                setLoading(false);
                return;
            }

            // Store in context (which also persists to localStorage)
            login(data.user, data.token);
            navigate('/dashboard');
        } catch {
            setError('Unable to connect to the server. Please try again later.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#111B21] p-4 relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute top-0 right-10 w-72 h-72 bg-[#25D366] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob"></div>
            <div className="absolute -bottom-8 right-1/4 w-72 h-72 bg-[#128C7E] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#34B7F1] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-blob animation-delay-4000"></div>

            <Card className="w-full max-w-md border-[#2A3942] bg-[#202C33]/90 backdrop-blur-xl shadow-2xl relative z-10 text-slate-100 my-8">
                <CardHeader className="space-y-3">
                    <div className="flex justify-center mb-2">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/30">
                            <MessageSquareShare className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold text-center tracking-tight bg-gradient-to-r from-[#25D366] to-[#51c482] bg-clip-text text-transparent">
                        Create an Account
                    </CardTitle>
                    <CardDescription className="text-center text-slate-400">
                        Join BulkNode & start scaling your outreach
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    {/* Error Banner */}
                    {error && (
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <User className="h-5 w-5" />
                                </div>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-10 bg-[#111B21] border-[#2A3942] text-white placeholder:text-slate-500 focus-visible:ring-[#25D366]"
                                    required
                                />
                            </div>
                        </div>
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
                            <Label htmlFor="businessName" className="text-slate-300">Business Name</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <Input
                                    id="businessName"
                                    type="text"
                                    placeholder="Company Ltd."
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="pl-10 bg-[#111B21] border-[#2A3942] text-white placeholder:text-slate-500 focus-visible:ring-[#25D366]"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessType" className="text-slate-300">Business Type</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                <Input
                                    id="businessType"
                                    type="text"
                                    placeholder="e.g. Retail, Software, Service"
                                    value={businessType}
                                    onChange={(e) => setBusinessType(e.target.value)}
                                    className="pl-10 bg-[#111B21] border-[#2A3942] text-white placeholder:text-slate-500 focus-visible:ring-[#25D366]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country" className="text-slate-300">Country</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 z-10">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full justify-between pl-10 bg-[#111B21] border-[#2A3942] text-slate-300 focus:ring-[#25D366] font-normal hover:bg-[#111B21] hover:text-white"
                                        >
                                            {country
                                                ? countries.find((c) => c.code === country)?.name
                                                : "Select your country..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0 bg-[#202C33] border-[#2A3942] text-slate-300">
                                        <Command className="bg-[#202C33] border-0">
                                            <CommandInput placeholder="Search country..." className="text-white placeholder:text-slate-500" />
                                            <CommandList>
                                                <CommandEmpty>No country found.</CommandEmpty>
                                                <CommandGroup>
                                                    {countries.map((c) => (
                                                        <CommandItem
                                                            key={c.code}
                                                            value={c.name}
                                                            className="text-slate-300 aria-selected:bg-[#111B21] aria-selected:text-[#25D366] cursor-pointer"
                                                            onSelect={() => {
                                                                setCountry(c.code === country ? "" : c.code);
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    country === c.code ? "opacity-100 text-[#25D366]" : "opacity-0"
                                                                )}
                                                            />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-[#111B21] border-[#2A3942] text-white placeholder:text-slate-500 focus-visible:ring-[#25D366]"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                            className="w-full mt-2 bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-bold border-0 shadow-lg shadow-[#25D366]/20 transition-all duration-300 h-11 text-md disabled:opacity-70"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
                            ) : 'Create Account'}
                        </Button>
                    </form>

                    <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[#2A3942]" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#202C33] px-2 text-slate-400">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full mt-6 bg-[#111B21] hover:bg-[#2A3942] border-[#2A3942] text-slate-300 h-11">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" aria-hidden="true">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Sign up with Google
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center pb-8 border-t border-[#2A3942]/50 pt-4 mt-6">
                    <p className="text-sm text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-[#25D366] hover:text-[#51c482] transition-colors">
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
