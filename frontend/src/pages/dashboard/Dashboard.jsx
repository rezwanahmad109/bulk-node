import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Users, UsersRound, Send, Megaphone, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();

    // All zeroes for a fresh account — will be replaced with real API data
    const stats = [
        {
            title: "Connected WhatsApp",
            value: "0/0",
            description: "Go to Account Manager to connect",
            icon: Smartphone,
            href: '/dashboard/accounts',
        },
        {
            title: "Virtual Groups",
            value: "0",
            description: "No groups created yet",
            icon: UsersRound,
            href: '/dashboard/groups',
        },
        {
            title: "Total Contacts",
            value: "0",
            description: "Sync WhatsApp to import contacts",
            icon: Users,
            href: '/dashboard/groups',
        },
        {
            title: "Messages Sent",
            value: "0",
            description: "No campaigns launched yet",
            icon: Send,
            href: '/dashboard/campaigns',
        }
    ];

    // Get first name for greeting
    const firstName = user?.fullName?.split(' ')[0] || 'there';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold text-slate-100 tracking-tight">
                    Welcome back, <span className="text-[#25D366]">{firstName}</span> 👋
                </h1>
                <p className="text-slate-400 mt-1">
                    {user?.businessName && (
                        <span className="text-slate-300 font-medium">{user.businessName} · </span>
                    )}
                    Here's your BulkNode overview.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Link to={stat.href} key={i}>
                        <Card className="bg-[#202C33] border-[#2A3942] backdrop-blur-md overflow-hidden relative group shadow-sm hover:shadow-lg hover:border-[#25D366]/30 transition-all duration-300 cursor-pointer h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-400">
                                    {stat.title}
                                </CardTitle>
                                <div className="p-2 rounded-lg bg-[#25D366]/10 shadow-[0_0_15px_rgba(37,211,102,0.08)] group-hover:bg-[#25D366]/20 transition-colors">
                                    <stat.icon className="w-5 h-5 text-[#25D366]" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold tracking-tight text-slate-100">{stat.value}</div>
                                <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Recent Campaign Activity — Empty State */}
            <Card className="bg-[#202C33] border-[#2A3942] shadow-sm">
                <CardHeader className="border-b border-[#2A3942]">
                    <CardTitle className="text-lg font-semibold text-slate-200">Recent Campaign Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Empty state — shown until real campaigns exist */}
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center mb-5 shadow-lg shadow-[#25D366]/5">
                            <Megaphone className="w-10 h-10 text-[#25D366]/60" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-200 mb-2">
                            No campaigns launched yet
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                            Connect your WhatsApp in the <span className="text-slate-300">Account Manager</span>, build a Virtual Group, then launch your first broadcast campaign.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                to="/dashboard/accounts"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-[#25D366]/20"
                            >
                                Connect WhatsApp
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                to="/dashboard/campaigns"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111B21] hover:bg-[#2A3942] text-slate-300 font-medium text-sm rounded-xl border border-[#2A3942] transition-colors"
                            >
                                View Campaign Panel
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
