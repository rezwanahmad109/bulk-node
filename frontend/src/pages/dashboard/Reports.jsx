import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Send, CheckCircle2, XCircle, TrendingUp, BarChart2,
    Clock, Users, Download, Calendar
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const STATS = [
    { title: 'Total Messages Sent', value: '24,580', description: 'All time', icon: Send, color: '#25D366' },
    { title: 'Avg Delivery Rate', value: '96.4%', description: '+1.2% this month', icon: TrendingUp, color: '#25D366' },
    { title: 'Failed Messages', value: '882', description: 'Invalid numbers mostly', icon: XCircle, color: '#ef4444' },
    { title: 'Campaigns Run', value: '47', description: 'Since account creation', icon: BarChart2, color: '#34B7F1' },
];

const CAMPAIGN_HISTORY = [
    { id: 1, name: 'Halkhata Invite 2026', group: 'Chuadanga VIP Dealers', sent: 450, delivered: 447, failed: 3, date: 'Apr 20, 2026', status: 'Completed' },
    { id: 2, name: 'Mileage King Battery Promo', group: 'Dhaka Retailers', sent: 500, delivered: 480, failed: 20, date: 'Apr 20, 2026', status: 'Running' },
    { id: 3, name: 'Eid Special Offer', group: 'Sylhet Distributors', sent: 200, delivered: 0, failed: 200, date: 'Apr 19, 2026', status: 'Failed' },
    { id: 4, name: 'Monthly Sales Update', group: 'Internal Sales Team', sent: 45, delivered: 45, failed: 0, date: 'Apr 19, 2026', status: 'Completed' },
    { id: 5, name: 'New Product Launch', group: 'Jessore Retailers', sent: 320, delivered: 308, failed: 12, date: 'Apr 18, 2026', status: 'Completed' },
    { id: 6, name: 'Stock Clearance Alert', group: 'Chuadanga VIP Dealers', sent: 45, delivered: 43, failed: 2, date: 'Apr 17, 2026', status: 'Completed' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getStatusStyle = (status) => {
    switch (status) {
        case 'Completed': return 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20';
        case 'Running':   return 'bg-[#34B7F1]/10 text-[#34B7F1] border border-[#34B7F1]/20';
        case 'Failed':    return 'bg-red-500/10 text-red-400 border border-red-500/20';
        default:          return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'Completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
        case 'Running':   return <Clock className="w-3.5 h-3.5 animate-pulse" />;
        case 'Failed':    return <XCircle className="w-3.5 h-3.5" />;
        default:          return null;
    }
};

// ─── Reports Page ─────────────────────────────────────────────────────────────

export default function Reports() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                        <BarChart2 className="w-7 h-7 text-[#25D366]" />
                        Analytics & Reports
                    </h1>
                    <p className="text-slate-400 mt-1">Track your campaign performance and delivery statistics.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#202C33] hover:bg-[#2A3942] border border-[#2A3942] text-slate-300 text-sm font-medium rounded-xl transition-colors">
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {STATS.map((stat, i) => (
                    <Card key={i} className="bg-[#202C33] border-[#2A3942] overflow-hidden relative group hover:border-[#2A3942]/80 transition-all duration-300 shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                                {stat.title}
                            </CardTitle>
                            <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight text-slate-100">{stat.value}</div>
                            <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Campaign History Table */}
            <Card className="bg-[#202C33] border-[#2A3942] shadow-sm">
                <CardHeader className="border-b border-[#2A3942]">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-200">Campaign History</CardTitle>
                            <p className="text-sm text-slate-400 mt-1">Showing last {CAMPAIGN_HISTORY.length} campaigns</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4" />
                            April 2026
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase tracking-wider border-b border-[#2A3942]">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Campaign</th>
                                    <th className="px-6 py-4 font-medium">Target Group</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Sent</th>
                                    <th className="px-6 py-4 font-medium">Delivery Rate</th>
                                    <th className="px-6 py-4 font-medium">Failed</th>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2A3942]">
                                {CAMPAIGN_HISTORY.map((c) => {
                                    const rate = c.sent > 0 ? Math.round((c.delivered / c.sent) * 100) : 0;
                                    return (
                                        <tr key={c.id} className="hover:bg-[#111B21]/40 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-200">{c.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Users className="w-3.5 h-3.5 text-[#25D366]" />
                                                    {c.group}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(c.status)}`}>
                                                    {getStatusIcon(c.status)}
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-300 font-semibold">{c.sent.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-1.5 bg-[#111B21] rounded-full overflow-hidden min-w-[60px]">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${rate}%`,
                                                                backgroundColor: rate >= 90 ? '#25D366' : rate >= 60 ? '#f59e0b' : '#ef4444'
                                                            }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-semibold w-10 text-right ${rate >= 90 ? 'text-[#25D366]' : rate >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                                                        {rate}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-red-400 font-medium">{c.failed}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{c.date}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Delivery Summary Bar */}
            <Card className="bg-[#202C33] border-[#2A3942] shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-200">Overall Delivery Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { label: 'Successfully Delivered', value: 1323, total: 1560, color: '#25D366' },
                            { label: 'Failed / Invalid Number', value: 237, total: 1560, color: '#ef4444' },
                            { label: 'Pending / In Queue', value: 0, total: 1560, color: '#34B7F1' },
                        ].map((item, i) => {
                            const pct = Math.round((item.value / item.total) * 100);
                            return (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-300">{item.label}</span>
                                        <span className="font-semibold text-slate-200">{item.value.toLocaleString()} <span className="text-slate-500 font-normal">({pct}%)</span></span>
                                    </div>
                                    <div className="h-2 bg-[#111B21] rounded-full overflow-hidden border border-[#2A3942]">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}40` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
