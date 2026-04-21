import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Smartphone, Trash2, RefreshCw, QrCode, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';
import socket, { connectSocketWithToken } from '@/utils/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AccountManager() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Connection flow states
    const [isLinking, setIsLinking] = useState(false);
    const [linkStep, setLinkStep] = useState(0); // 0: Name, 1: Connecting, 2: QR, 3: Success
    const [accountName, setAccountName] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [activeSessionId, setActiveSessionId] = useState('');
    const [isDeleting, setIsDeleting] = useState(null);

    // 1. Fetch existing sessions from backend
    const fetchSessions = async () => {
        try {
            const token = localStorage.getItem('bulknode_token');
            const res = await axios.get(`${API_URL}/api/whatsapp/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setAccounts(res.data.sessions);
            }
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
            setError('Could not load WhatsApp accounts.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    // 2. Socket listeners for real-time updates
    useEffect(() => {
        if (!activeSessionId) return;

        const onQr = (data) => {
            if (data.sessionId === activeSessionId) {
                setQrCode(data.qr);
                setLinkStep(2);
            }
        };

        const onStatus = (data) => {
            if (data.sessionId === activeSessionId) {
                if (data.status === 'connected') {
                    setLinkStep(3);
                    // Refresh the list after a short delay
                    setTimeout(() => {
                        fetchSessions();
                        setLinkStep(0);
                        setIsLinking(false);
                        setActiveSessionId('');
                    }, 2000);
                }
            }
        };

        const onError = (data) => {
            if (data.sessionId === activeSessionId) {
                setError(data.message || 'Connection failed.');
                setLinkStep(0);
            }
        };

        socket.on('whatsapp:qr', onQr);
        socket.on('whatsapp:status', onStatus);
        socket.on('whatsapp:error', onError);

        return () => {
            socket.off('whatsapp:qr', onQr);
            socket.off('whatsapp:status', onStatus);
            socket.off('whatsapp:error', onError);
        };
    }, [activeSessionId]);

    // 3. Initiate Connection Flow
    const handleStartConnection = async () => {
        if (!accountName.trim()) return;

        try {
            setLinkStep(1);
            const token = localStorage.getItem('bulknode_token');
            if (!token) {
                setError('Your session has expired. Please log in again.');
                setLinkStep(0);
                return;
            }

            const res = await axios.post(`${API_URL}/api/whatsapp/connect`,
                { name: accountName },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                const sid = res.data.sessionId;
                connectSocketWithToken(token);
                setActiveSessionId(sid);

                // Join secure room for this session (server validates owner via handshake JWT).
                socket.emit('join-session', sid);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start connection.');
            setLinkStep(0);
        }
    };

    // 4. Handle Disconnect/Delete
    const handleDeleteAccount = async (sessionId) => {
        if (!confirm('Are you sure you want to remove this account? You will need to scan QR code again to reconnect.')) return;

        try {
            setIsDeleting(sessionId);
            const token = localStorage.getItem('bulknode_token');
            await axios.delete(`${API_URL}/api/whatsapp/disconnect/${sessionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSessions();
        } catch (err) {
            alert('Failed to delete account.');
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <Smartphone className="w-6 h-6 text-[#25D366]" />
                        WhatsApp Accounts
                    </h1>
                    <p className="text-slate-400 mt-1">Manage your multi-device WhatsApp connections</p>
                </div>

                <Dialog open={isLinking} onOpenChange={(open) => {
                    setIsLinking(open);
                    if (!open) {
                        setLinkStep(0);
                        setActiveSessionId('');
                        setAccountName('');
                        setQrCode('');
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-semibold border-0 shadow-lg shadow-[#25D366]/20">
                            <Plus className="w-5 h-5 mr-2" />
                            Add WhatsApp Account
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-[#202C33] border-[#2A3942] text-slate-200">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white text-center">
                                {linkStep === 3 ? 'Successfully Connected!' : 'Link WhatsApp'}
                            </DialogTitle>
                            <DialogDescription className="text-center text-slate-400">
                                {linkStep === 0 && 'Give this account a name to get started'}
                                {linkStep === 1 && 'Initializing WhatsApp engine...'}
                                {linkStep === 2 && 'Scan the QR code with your phone'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col items-center py-6 space-y-6">
                            {linkStep === 0 && (
                                <div className="w-full space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="acc-name">Account Nickname</Label>
                                        <Input
                                            id="acc-name"
                                            placeholder="e.g. Sales Team, Support #1"
                                            value={accountName}
                                            onChange={(e) => setAccountName(e.target.value)}
                                            className="bg-[#111B21] border-[#2A3942] text-white"
                                        />
                                    </div>
                                    <Button
                                        onClick={handleStartConnection}
                                        disabled={!accountName.trim()}
                                        className="w-full bg-[#25D366] text-[#111B21] font-bold"
                                    >
                                        Generate QR Code
                                    </Button>
                                </div>
                            )}

                            {linkStep === 1 && (
                                <div className="flex flex-col items-center gap-4 py-8">
                                    <Loader2 className="w-12 h-12 text-[#25D366] animate-spin" />
                                    <p className="text-sm text-slate-400">Setting up secure session...</p>
                                </div>
                            )}

                            {linkStep === 2 && qrCode && (
                                <>
                                    <div className="p-4 bg-white rounded-xl shadow-lg relative group">
                                        <div className="w-48 h-48 bg-white flex items-center justify-center rounded-lg relative overflow-hidden">
                                            <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-full" />
                                            <div className="absolute top-0 left-0 w-full h-1 bg-[#25D366] shadow-[0_0_10px_#25D366] animate-scan"></div>
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-sm font-medium text-slate-300">1. Open WhatsApp on your phone</p>
                                        <p className="text-sm font-medium text-slate-300">2. Tap <strong>Menu/Settings &gt; Linked Devices</strong></p>
                                        <p className="text-sm font-medium text-slate-200">3. Point your phone to this screen</p>
                                    </div>
                                </>
                            )}

                            {linkStep === 3 && (
                                <div className="flex flex-col items-center gap-4 py-8">
                                    <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-12 h-12 text-[#25D366] animate-bounce" />
                                    </div>
                                    <p className="text-lg font-bold text-white">All Set!</p>
                                    <p className="text-sm text-slate-400 text-center">Your account is now linked and ready for broadcasting.</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-xs underline underline-offset-2">Dismiss</button>
                </div>
            )}

            {/* Accounts Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 text-[#25D366] animate-spin" />
                </div>
            ) : accounts.length === 0 ? (
                <Card className="bg-[#202C33] border-dashed border-[#2A3942] py-20">
                    <CardContent className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-[#25D366]/5 flex items-center justify-center mb-4">
                            <QrCode className="w-8 h-8 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-300">No accounts connected</h3>
                        <p className="text-slate-500 max-w-sm mt-1">Connect your first WhatsApp account to start managing your virtual groups and campaigns.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((account) => (
                        <Card key={account.sessionId} className="bg-[#202C33] border-[#2A3942] overflow-hidden hover:border-[#25D366]/40 transition-all duration-300 group shadow-lg">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2 border-b border-[#111B21]">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-[#202C33]">
                                    {(account.name?.[0] || '?').toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg truncate">
                                        {account.name || 'Unnamed Account'}
                                    </h3>
                                    <p className="text-[#25D366] font-medium text-sm truncate">
                                        {account.phoneNumber ? `+${account.phoneNumber}` : 'Needs setup'}
                                    </p>
                                </div>
                            </CardHeader>
                            <CardContent className="py-4 bg-[#111B21]/30">
                                <div className="flex items-center justify-between">
                                    <Badge
                                        className={`
                                            ${account.status === 'connected'
                                                ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20'
                                                : account.status === 'connecting'
                                                ? 'bg-[#34B7F1]/10 text-[#34B7F1] border-[#34B7F1]/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'}
                                        `}
                                    >
                                        <span className={`w-2 h-2 rounded-full mr-2 ${
                                            account.status === 'connected' ? 'bg-[#25D366]' :
                                            account.status === 'connecting' ? 'bg-[#34B7F1]' : 'bg-red-500'
                                        }`}></span>
                                        {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                                    </Badge>
                                    <span className="text-[10px] text-slate-500">ID: {account.sessionId.split('_').pop()}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-[#111B21]/50 border-t border-[#2A3942] flex justify-between px-4 py-3">
                                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-[#2A3942]">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Refresh
                                </Button>
                                <Button
                                    onClick={() => handleDeleteAccount(account.sessionId)}
                                    disabled={isDeleting === account.sessionId}
                                    variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                >
                                    {isDeleting === account.sessionId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Remove
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    50% { opacity: 1; box-shadow: 0 0 15px #25D366, 0 0 30px #25D366; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 2s linear infinite;
                }
            `}</style>
        </div>
    );
}
