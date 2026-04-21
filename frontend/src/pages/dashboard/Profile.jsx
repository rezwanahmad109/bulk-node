import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    User, Mail, Building2, Briefcase, Globe,
    LogOut, Shield, Bell, ChevronRight, Settings
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Profile() {
    const { user, logout, getInitials } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const fields = [
        { label: 'Full Name', value: user?.fullName, icon: User },
        { label: 'Email Address', value: user?.email, icon: Mail },
        { label: 'Business Name', value: user?.businessName, icon: Building2 },
        { label: 'Business Type', value: user?.businessType || '—', icon: Briefcase },
        { label: 'Country', value: user?.country || '—', icon: Globe },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                    <Settings className="w-7 h-7 text-[#25D366]" />
                    Account & Profile
                </h1>
                <p className="text-slate-400 mt-1">Manage your BulkNode account details.</p>
            </div>

            {/* Avatar Card */}
            <Card className="bg-[#202C33] border-[#2A3942] shadow-sm overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-[#25D366]/20 via-[#128C7E]/10 to-transparent" />
                <CardContent className="pt-0 pb-6 px-6 -mt-10">
                    <div className="flex items-end gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[#25D366]/20 border-4 border-[#202C33]">
                            {getInitials()}
                        </div>
                        <div className="pb-1">
                            <h2 className="text-xl font-bold text-slate-100">{user?.fullName || 'User'}</h2>
                            <p className="text-sm text-[#25D366]">{user?.businessName || 'BulkNode User'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Fields */}
            <Card className="bg-[#202C33] border-[#2A3942] shadow-sm">
                <CardHeader className="border-b border-[#2A3942]">
                    <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#25D366]" />
                        Profile Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {fields.map((field, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-6 py-4 border-b border-[#2A3942] last:border-0 hover:bg-[#111B21]/30 transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-lg bg-[#25D366]/10 flex items-center justify-center flex-shrink-0">
                                <field.icon className="w-4 h-4 text-[#25D366]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-500 mb-0.5">{field.label}</p>
                                <p className="text-sm font-medium text-slate-200 truncate">
                                    {field.value || <span className="text-slate-500 italic">Not set</span>}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="bg-[#202C33] border-[#2A3942] shadow-sm">
                <CardHeader className="border-b border-[#2A3942]">
                    <CardTitle className="text-base font-semibold text-slate-200 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#25D366]" />
                        Account Actions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3 bg-[#111B21] border-[#2A3942] text-slate-300 hover:text-white hover:bg-[#2A3942] h-11"
                    >
                        <Bell className="w-4 h-4 text-[#25D366]" />
                        Notification Preferences
                    </Button>
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full justify-start gap-3 bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-11"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out from BulkNode
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
