import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserSquare2, Users, Megaphone, BarChart, Menu, Bell, Search, FileText, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const { user, getInitials } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Inbox', href: '/dashboard/inbox', icon: MessageSquare },
        { name: 'Account Manager', href: '/dashboard/accounts', icon: UserSquare2 },
        { name: 'Virtual Groups', href: '/dashboard/groups', icon: Users },
        { name: 'Message Templates', href: '/dashboard/templates', icon: FileText },
        { name: 'Campaign Panel', href: '/dashboard/campaigns', icon: Megaphone },
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart },
    ];

    return (
        <div className="min-h-screen bg-[#111B21] text-slate-200 font-sans selection:bg-[#25D366]/30 flex overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#25D366]/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#128C7E]/5 blur-[120px]" />
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-[#202C33] border-r border-[#2A3942] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block flex-shrink-0 shadow-2xl lg:shadow-none",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    <div className="h-20 flex items-center px-8 border-b border-[#2A3942]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                                <Megaphone className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-[#25D366] to-[#51c482] bg-clip-text text-transparent transform tracking-tight">
                                BulkNode
                            </span>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                        isActive
                                            ? "bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20"
                                            : "text-slate-400 hover:text-[#25D366] hover:bg-[#111B21]/50"
                                    )}
                                >
                                    <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-[#25D366]" : "text-slate-500 group-hover:text-[#25D366]")} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom User Profile Card */}
                    <div className="p-4 border-t border-[#2A3942] mt-auto">
                        <Link
                            to="/dashboard/profile"
                            className="bg-[#111B21]/50 rounded-xl p-4 flex items-center gap-3 border border-[#2A3942] backdrop-blur-sm hover:border-[#25D366]/30 hover:bg-[#111B21]/80 transition-all group cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center flex-shrink-0 shadow-md">
                                <span className="font-bold text-sm text-white">{getInitials()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-200 truncate">{user?.fullName || 'User'}</p>
                                <p className="text-xs text-[#25D366] truncate">{user?.businessName || 'BulkNode'}</p>
                            </div>
                            <Settings className="w-4 h-4 text-slate-500 group-hover:text-[#25D366] transition-colors flex-shrink-0" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Header */}
                <header className="h-20 bg-[#202C33]/90 backdrop-blur-md border-b border-[#2A3942] flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lg:hidden text-slate-400 hover:text-[#25D366]"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Menu className="w-6 h-6" />
                            </Button>
                            <span className="text-xl font-bold bg-gradient-to-r from-[#25D366] to-[#51c482] bg-clip-text text-transparent lg:hidden ml-1 tracking-tight">
                                BulkNode
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 bg-[#111B21] border border-[#2A3942] rounded-full px-4 py-2 w-64 lg:w-96 transition-colors focus-within:border-[#25D366]/50 focus-within:bg-[#111B21]">
                            <Search className="w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search campaigns, contacts..."
                                className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-[#25D366] rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#25D366] rounded-full border-2 border-[#202C33]"></span>
                        </Button>
                        <Link
                            to="/dashboard/profile"
                            className="w-9 h-9 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] p-[2px] cursor-pointer hidden sm:block hover:shadow-lg hover:shadow-[#25D366]/20 transition-shadow"
                        >
                            <div className="w-full h-full bg-[#111B21] rounded-full flex items-center justify-center hover:bg-[#202C33] transition-colors">
                                <span className="text-xs font-bold text-slate-200">{getInitials()}</span>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content Viewport */}
                <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
