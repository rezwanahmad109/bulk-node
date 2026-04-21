import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Rocket, Image as ImageIcon, Zap, AlertCircle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const DEFAULT_MIN_DELAY = "15";
const DEFAULT_MAX_DELAY = "45";

const targetGroups = [
    { id: "1", name: "Chuadanga VIP Dealers (45 Contacts)" },
    { id: "2", name: "Jessore Retailers (120 Contacts)" },
    { id: "3", name: "Internal Sales Team (15 Contacts)" }
];

const mockContacts = [
    { id: 1, name: "Anisur Rahman", phone: "+880 1711-000000" },
    { id: 2, name: "Ruhul Amin", phone: "+880 1612-111111" },
    { id: 3, name: "Suman Kumar", phone: "+880 1913-222222" },
    { id: 4, name: "Tariqul Islam", phone: "+880 1514-333333" },
    { id: 5, name: "Kamal Hossain", phone: "+880 1315-444444" },
    { id: 6, name: "Mizanur Rahman", phone: "+880 1416-555555" },
    { id: 7, name: "Shafiqul Alam", phone: "+880 1817-666666" }
];

const groupContactIds = {
    "1": [1, 2, 3],
    "2": [4, 5, 6, 7],
    "3": [2, 6],
};

export default function CampaignPanel() {
    const [campaignName, setCampaignName] = useState("");
    const [message, setMessage] = useState("");
    const [minDelay, setMinDelay] = useState(DEFAULT_MIN_DELAY);
    const [maxDelay, setMaxDelay] = useState(DEFAULT_MAX_DELAY);
    const [selectedGroupId, setSelectedGroupId] = useState("");

    // Selection Type States
    const [selectionType, setSelectionType] = useState('group'); // 'group' or 'random'
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState("");
    const [isLaunching, setIsLaunching] = useState(false);
    const [sessionError, setSessionError] = useState("");
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchActiveSession = async () => {
            try {
                const token = localStorage.getItem('bulknode_token');
                if (!token) {
                    if (isMounted) {
                        setSessionError('Login session missing. Please login again.');
                    }
                    return;
                }

                const res = await axios.get(`${API_URL}/api/whatsapp/sessions`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const sessions = res.data?.sessions || [];
                const connectedSession = sessions.find((session) => session.status === 'connected');
                const fallbackSession = sessions[0];

                if (isMounted) {
                    if (connectedSession) {
                        setActiveSessionId(connectedSession.sessionId);
                    } else if (fallbackSession) {
                        setActiveSessionId(fallbackSession.sessionId);
                    } else {
                        setSessionError('No WhatsApp account found. Connect an account first.');
                    }
                }
            } catch (error) {
                if (isMounted) {
                    setSessionError('Failed to load WhatsApp session. Try again.');
                }
            }
        };

        fetchActiveSession();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!notification) return undefined;

        const timer = setTimeout(() => {
            setNotification(null);
        }, 3500);

        return () => clearTimeout(timer);
    }, [notification]);

    const toggleContact = (id) => {
        if (selectedContacts.includes(id)) {
            setSelectedContacts(prev => prev.filter(cId => cId !== id));
        } else if (selectedContacts.length < 30) {
            setSelectedContacts(prev => [...prev, id]);
        }
    };

    const handleVariableClick = (variable) => {
        setMessage(prev => prev + variable);
    };

    const selectedIndividualContacts = useMemo(
        () => mockContacts.filter((contact) => selectedContacts.includes(contact.id)),
        [selectedContacts]
    );

    const selectedGroupContacts = useMemo(() => {
        const contactIds = groupContactIds[selectedGroupId] || [];
        return mockContacts.filter((contact) => contactIds.includes(contact.id));
    }, [selectedGroupId]);

    const recipients = selectionType === 'group' ? selectedGroupContacts : selectedIndividualContacts;

    const resetForm = () => {
        setCampaignName("");
        setMessage("");
        setMinDelay(DEFAULT_MIN_DELAY);
        setMaxDelay(DEFAULT_MAX_DELAY);
        setSelectionType('group');
        setSelectedGroupId("");
        setSelectedContacts([]);
    };

    const handleLaunchCampaign = async () => {
        if (isLaunching) return;

        if (!activeSessionId) {
            setNotification({ type: 'error', message: 'No active WhatsApp session. Please connect one account first.' });
            return;
        }

        if (!message.trim()) {
            setNotification({ type: 'error', message: 'Message content is required.' });
            return;
        }

        if (selectionType === 'group' && !selectedGroupId) {
            setNotification({ type: 'error', message: 'Please select a target group.' });
            return;
        }

        if (selectionType === 'random' && selectedIndividualContacts.length === 0) {
            setNotification({ type: 'error', message: 'Please select at least one contact.' });
            return;
        }

        if (recipients.length === 0) {
            setNotification({ type: 'error', message: 'No valid recipients found for this campaign.' });
            return;
        }

        try {
            setIsLaunching(true);
            const token = localStorage.getItem('bulknode_token');

            if (!token) {
                setNotification({ type: 'error', message: 'Login session missing. Please login again.' });
                return;
            }

            const payload = {
                sessionId: activeSessionId,
                contacts: recipients.map((contact) => ({
                    phone: contact.phone,
                    name: contact.name,
                })),
                message: message.trim(),
            };

            const res = await axios.post(`${API_URL}/api/whatsapp/campaign/launch`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 202) {
                const queuedCount = res.data?.queuedCount ?? recipients.length;
                setNotification({
                    type: 'success',
                    message: `Campaign queued successfully. ${queuedCount} message(s) added to queue.`,
                });
                resetForm();
            } else {
                setNotification({ type: 'error', message: 'Unexpected response from server.' });
            }
        } catch (error) {
            const apiError = error?.response?.data?.error;
            setNotification({
                type: 'error',
                message: apiError || 'Failed to launch campaign. Please try again.',
            });
        } finally {
            setIsLaunching(false);
        }
    };

    return (
        <div className="p-6 space-y-6 h-[calc(100vh-5rem)] overflow-y-auto">
            {notification && (
                <div className={`fixed right-6 top-24 z-50 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
                    notification.type === 'success'
                        ? 'bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366]'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                    <div className="flex items-start gap-3">
                        {notification.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 mt-0.5" />
                        ) : (
                            <AlertCircle className="h-5 w-5 mt-0.5" />
                        )}
                        <p className="text-sm font-medium">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col gap-2 shrink-0">
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-[#25D366]" />
                    Campaign Broadcaster
                </h1>
                <p className="text-slate-400">Send personalized bulk messages safely adhering to anti-ban protocols.</p>
            </div>

            {sessionError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm">{sessionError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column: Form Setup */}
                <div className="xl:col-span-2 space-y-6">
                    <Card className="bg-[#202C33] border-[#2A3942]">
                        <CardContent className="p-6 space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Campaign Name */}
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Campaign Name</Label>
                                    <Input
                                        placeholder="e.g., Eid Promo May 2026"
                                        value={campaignName}
                                        onChange={(e) => setCampaignName(e.target.value)}
                                        className="bg-[#111B21] border-[#2A3942] text-white focus-visible:ring-[#25D366]"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-slate-300">Audience Selection Type</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setSelectionType('group')}
                                            className={`p-4 border rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${selectionType === 'group' ? 'bg-[#25D366]/10 border-[#25D366]/50 text-[#25D366]' : 'bg-[#111B21] border-[#2A3942] text-slate-400 hover:border-slate-500'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectionType === 'group' ? 'border-[#25D366]' : 'border-slate-500'}`}>
                                                {selectionType === 'group' && <div className="w-2 h-2 bg-[#25D366] rounded-full" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${selectionType === 'group' ? 'text-white' : ''}`}>Send to Virtual Group</span>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() => setSelectionType('random')}
                                            className={`p-4 border rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${selectionType === 'random' ? 'bg-[#25D366]/10 border-[#25D366]/50 text-[#25D366]' : 'bg-[#111B21] border-[#2A3942] text-slate-400 hover:border-slate-500'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectionType === 'random' ? 'border-[#25D366]' : 'border-slate-500'}`}>
                                                {selectionType === 'random' && <div className="w-2 h-2 bg-[#25D366] rounded-full" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-medium ${selectionType === 'random' ? 'text-white' : ''}`}>Random Selection</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dynamic Rendering based on Selection */}
                                    {selectionType === 'group' ? (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <Label className="text-slate-300">Target Group</Label>
                                            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                                                <SelectTrigger className="bg-[#111B21] border-[#2A3942] text-slate-300 focus:ring-[#25D366]">
                                                    <SelectValue placeholder="Select Audience segment" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#202C33] border-[#2A3942] text-slate-300">
                                                    {targetGroups.map(group => (
                                                        <SelectItem key={group.id} value={group.id} className="hover:bg-[#111B21] focus:bg-[#111B21]">
                                                            {group.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex justify-between items-center bg-[#111B21] p-3 rounded-t-xl border border-[#2A3942] border-b-0">
                                                <Label className="text-slate-300">Select Individual Contacts</Label>
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${selectedContacts.length === 30 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20'}`}>
                                                    Selected: {selectedContacts.length}/30 Max
                                                </span>
                                            </div>
                                            <div className="bg-[#111B21] border border-[#2A3942] rounded-b-xl border-t-0 p-2 max-h-60 overflow-y-auto space-y-1">
                                                {mockContacts.map(contact => {
                                                    const isSelected = selectedContacts.includes(contact.id);
                                                    const isDisabled = !isSelected && selectedContacts.length >= 30;
                                                    return (
                                                        <div key={contact.id} className={`flex items-center gap-3 p-3 rounded-lg border border-transparent hover:border-[#2A3942] hover:bg-[#202C33] transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} onClick={() => !isDisabled && toggleContact(contact.id)}>
                                                            <Checkbox
                                                                checked={isSelected}
                                                                disabled={isDisabled}
                                                                className="border-[#2A3942] bg-[#202C33] text-[#25D366] data-[state=checked]:bg-[#25D366] data-[state=checked]:text-[#111B21]"
                                                            />
                                                            <div className="flex justify-between flex-1">
                                                                <span className="text-sm font-medium text-white">{contact.name}</span>
                                                                <span className="text-xs text-slate-400">{contact.phone}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Anti-Ban Delays */}
                            <div className="p-4 bg-[#111B21] rounded-xl border border-[#25D366]/20">
                                <div className="flex items-start gap-3 mb-4">
                                    <AlertCircle className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-[#25D366] font-medium">Smart Anti-Ban Settings</h3>
                                        <p className="text-xs text-slate-400 mt-1">
                                            To behave like a human and avoid bans, the system will pause randomly between these intervals. It will also simulate a "typing..." status.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-xs text-slate-400">Min Delay (Seconds)</Label>
                                        <Input
                                            type="number"
                                            value={minDelay}
                                            onChange={(e) => setMinDelay(e.target.value)}
                                            className="bg-[#202C33] border-[#2A3942] text-white focus-visible:ring-[#25D366]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300 text-xs text-slate-400">Max Delay (Seconds)</Label>
                                        <Input
                                            type="number"
                                            value={maxDelay}
                                            onChange={(e) => setMaxDelay(e.target.value)}
                                            className="bg-[#202C33] border-[#2A3942] text-white focus-visible:ring-[#25D366]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="space-y-2">
                                <Label className="text-slate-300 flex justify-between">
                                    Message Content
                                    <span className="text-xs text-slate-500">Variables enable 1-to-1 personalization</span>
                                </Label>
                                <Textarea
                                    placeholder="Salam [Name] bhai, asha kori bhalo achen..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="bg-[#111B21] border-[#2A3942] text-white focus-visible:ring-[#25D366] min-h-[150px] resize-y"
                                />
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVariableClick("[Name]")}
                                        className="bg-transparent border-[#2A3942] text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
                                    >
                                        <Zap className="w-3 h-3 mr-1" /> [Name]
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVariableClick("[Company]")}
                                        className="bg-transparent border-[#2A3942] text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
                                    >
                                        <Zap className="w-3 h-3 mr-1" /> [Company]
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleVariableClick("[Phone]")}
                                        className="bg-transparent border-[#2A3942] text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
                                    >
                                        <Zap className="w-3 h-3 mr-1" /> [Phone]
                                    </Button>
                                </div>
                            </div>

                            {/* Media Upload */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Attach Media (Image/PDF)</Label>
                                <div className="border-2 border-dashed border-[#2A3942] rounded-xl p-8 flex flex-col items-center justify-center bg-[#111B21]/50 hover:bg-[#111B21] transition-colors cursor-pointer group">
                                    <div className="w-12 h-12 rounded-full bg-[#202C33] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-6 h-6 text-[#25D366]" />
                                    </div>
                                    <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
                                    <p className="text-slate-500 text-sm mt-1">SVG, PNG, JPG or PDF (max. 5MB)</p>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Live Preview & Action */}
                <div className="space-y-6">
                    {/* Phone Preview */}
                    <Card className="bg-[#111B21] border-[#2A3942] overflow-hidden sticky top-6">
                        <div className="bg-[#202C33] p-4 border-b border-[#2A3942] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2A3942] flex items-center justify-center shrink-0">
                                <span className="text-slate-300 font-medium text-sm">C</span>
                            </div>
                            <div>
                                <h4 className="text-white font-medium text-sm">Customer Preview</h4>
                                <p className="text-[#25D366] text-xs">typing...</p>
                            </div>
                        </div>

                        {/* WhatsApp Chat Background Simulation */}
                        <div className="bg-[#0b141a] p-4 min-h-[300px] flex flex-col justify-end space-y-4" style={{ backgroundImage: "url('https://i.ibb.co/3yLZ2Qz/wa-bg.png')", backgroundSize: 'cover', backgroundBlendMode: 'overlay' }}>
                            <div className="bg-[#202C33] p-2 rounded-xl rounded-tl-none self-start max-w-[85%] border border-[#2A3942]">
                                <p className="text-slate-300 text-sm">Hey, I'm interested in your new products! Do you have any updates?</p>
                                <p className="text-[10px] text-slate-500 text-right mt-1">10:45 AM</p>
                            </div>

                            <div className="bg-[#005c4b] p-2 rounded-xl rounded-tr-none self-end max-w-[85%] relative shadow-sm">
                                <p className="text-[#e9edef] text-sm whitespace-pre-wrap break-words">
                                    {message || "Your message will appear here..."}
                                </p>
                                <p className="text-[10px] text-[#8696a0] text-right mt-1 flex justify-end items-center gap-1">
                                    10:46 AM
                                    <svg viewBox="0 0 16 11" height="11" width="16" preserveAspectRatio="xMidYMid meet" className="fill-[#53bdeb]"><path d="M11.8 1.6L10.2 0L5.4 4.8L4.6 4L3 5.6L5.4 8L11.8 1.6ZM15 0L8.6 6.4L15 12.8L16.6 11.2L11.8 6.4L16.6 1.6L15 0ZM0 5.6L1.6 4L4 6.4L2.4 8L0 5.6Z"></path></svg>
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-[#202C33] border-t border-[#2A3942]">
                            <Button
                                onClick={handleLaunchCampaign}
                                disabled={isLaunching}
                                className="w-full bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-bold py-6 text-lg tracking-wide rounded-xl shadow-lg shadow-[#25D366]/20 disabled:opacity-70"
                            >
                                {isLaunching ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Queueing Campaign...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Launch Campaign
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-slate-500 mt-3 text-center">
                                {activeSessionId ? `Session: ${activeSessionId}` : 'No active session selected'} - Recipients: {recipients.length}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
