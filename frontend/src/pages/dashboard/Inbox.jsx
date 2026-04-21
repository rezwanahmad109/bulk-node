import React, { useState } from 'react';
import { Search, MoreVertical, Paperclip, Send, User, Check, CheckCheck, Smile, Phone, Video } from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_CHATS = [
    {
        id: 1,
        name: 'Anisur Rahman',
        avatar: 'AR',
        phone: '+880 1711-000000',
        lastMessage: 'Thanks for the update bhai!',
        time: '10:45 AM',
        unread: 2,
        online: true,
        messages: [
            { id: 1, text: 'Assalamu Alaikum, hope you are doing well.', sender: 'me', time: '10:28 AM', status: 'read' },
            { id: 2, text: 'Please check the new product catalog I just sent.', sender: 'me', time: '10:30 AM', status: 'read' },
            { id: 3, text: 'Wa Alaikum Assalam bhai! I got it.', sender: 'them', time: '10:40 AM' },
            { id: 4, text: 'Let me review and get back to you.', sender: 'them', time: '10:41 AM' },
            { id: 5, text: 'Great, take your time. Let me know if you have questions.', sender: 'me', time: '10:43 AM', status: 'delivered' },
            { id: 6, text: 'Thanks for the update bhai!', sender: 'them', time: '10:45 AM' },
        ]
    },
    {
        id: 2,
        name: 'Sarah Smith',
        avatar: 'SS',
        phone: '+1 415-555-2671',
        lastMessage: 'When is the next batch arriving?',
        time: 'Yesterday',
        unread: 0,
        online: false,
        messages: [
            { id: 1, text: 'Hi! I wanted to ask about our next order.', sender: 'them', time: '4:00 PM' },
            { id: 2, text: 'When is the next batch arriving?', sender: 'them', time: '4:01 PM' },
            { id: 3, text: 'Hi Sarah! The next shipment is scheduled for the 25th.', sender: 'me', time: '4:15 PM', status: 'read' },
        ]
    },
    {
        id: 3,
        name: 'Kamal Hossain',
        avatar: 'KH',
        phone: '+880 1315-444444',
        lastMessage: 'Understood. Will do.',
        time: 'Tuesday',
        unread: 5,
        online: true,
        messages: [
            { id: 1, text: 'Bhai, can you send the invoice for last month?', sender: 'them', time: '9:00 AM' },
            { id: 2, text: 'Sure, sending it now.', sender: 'me', time: '9:10 AM', status: 'read' },
            { id: 3, text: 'Please make sure payment is done by the 30th.', sender: 'me', time: '9:11 AM', status: 'read' },
            { id: 4, text: 'Understood. Will do.', sender: 'them', time: '9:15 AM' },
        ]
    },
];

// ─── Inbox Component ─────────────────────────────────────────────────────────

export default function Inbox() {
    const [activeChat, setActiveChat] = useState(MOCK_CHATS[0]);
    const [messageInput, setMessageInput] = useState('');
    const [chats, setChats] = useState(MOCK_CHATS);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredChats = chats.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelectChat = (chat) => {
        // Clear unread count on selection
        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
        setActiveChat(chats.find(c => c.id === chat.id));
    };

    const handleSendMessage = () => {
        if (!messageInput.trim() || !activeChat) return;

        const newMsg = {
            id: Date.now(),
            text: messageInput.trim(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'delivered',
        };

        // Update messages in active chat (optimistic UI)
        const updatedChats = chats.map(c => {
            if (c.id !== activeChat.id) return c;
            return {
                ...c,
                messages: [...c.messages, newMsg],
                lastMessage: newMsg.text,
                time: newMsg.time,
            };
        });

        setChats(updatedChats);
        setActiveChat(updatedChats.find(c => c.id === activeChat.id));
        setMessageInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex h-[calc(100vh-5rem)] gap-0 rounded-2xl overflow-hidden border border-[#2A3942] bg-[#111B21]">

            {/* ── Left Panel: Chat List ─────────────────────────────── */}
            <div className="w-[340px] flex-shrink-0 bg-[#202C33] flex flex-col border-r border-[#2A3942]">
                {/* Header */}
                <div className="h-16 px-4 flex items-center justify-between border-b border-[#2A3942] bg-[#202C33]">
                    <h2 className="text-lg font-bold text-slate-200">Inbox</h2>
                    <button className="text-slate-400 hover:text-[#25D366] transition-colors p-1 rounded-lg hover:bg-[#2A3942]">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-3 pt-3 pb-2">
                    <div className="bg-[#111B21] rounded-xl flex items-center px-3 py-2.5 gap-2 border border-[#2A3942] focus-within:border-[#25D366]/50 transition-colors">
                        <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => handleSelectChat(chat)}
                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-[#2A3942]/50 ${activeChat?.id === chat.id ? 'bg-[#2A3942]' : 'hover:bg-[#2A3942]/40'}`}
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {chat.avatar}
                                </div>
                                {chat.online && (
                                    <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#202C33] rounded-full" />
                                )}
                            </div>

                            {/* Preview */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between mb-0.5">
                                    <h3 className="font-semibold text-slate-200 truncate text-sm">{chat.name}</h3>
                                    <span className={`text-[11px] flex-shrink-0 ml-2 ${chat.unread > 0 ? 'text-[#25D366]' : 'text-slate-500'}`}>{chat.time}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-400 truncate pr-2">{chat.lastMessage}</p>
                                    {chat.unread > 0 && (
                                        <span className="bg-[#25D366] text-[#111B21] text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center flex-shrink-0">
                                            {chat.unread}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredChats.length === 0 && (
                        <div className="text-center text-slate-500 text-sm py-12">
                            <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                            No conversations found
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right Panel: Chat Window ──────────────────────────── */}
            <div className="flex-1 flex flex-col bg-chat-pattern min-w-0">
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-4 bg-[#202C33] border-b border-[#2A3942] flex items-center justify-between flex-shrink-0 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm shadow">
                                        {activeChat.avatar}
                                    </div>
                                    {activeChat.online && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-[#202C33] rounded-full" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-100 leading-tight">{activeChat.name}</h2>
                                    <p className={`text-xs leading-tight ${activeChat.online ? 'text-[#25D366]' : 'text-slate-500'}`}>
                                        {activeChat.online ? 'Online' : 'Offline'} · {activeChat.phone}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                                <button className="p-2 rounded-full hover:bg-[#2A3942] hover:text-[#25D366] transition-colors">
                                    <Phone className="w-4.5 h-4.5" />
                                </button>
                                <button className="p-2 rounded-full hover:bg-[#2A3942] hover:text-[#25D366] transition-colors">
                                    <Video className="w-4.5 h-4.5" />
                                </button>
                                <button className="p-2 rounded-full hover:bg-[#2A3942] hover:text-[#25D366] transition-colors">
                                    <Search className="w-4.5 h-4.5" />
                                </button>
                                <button className="p-2 rounded-full hover:bg-[#2A3942] hover:text-[#25D366] transition-colors">
                                    <MoreVertical className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        </div>

                        {/* Message Area */}
                        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
                            {activeChat.messages.map((msg) => {
                                const isMe = msg.sender === 'me';
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`
                                            max-w-[70%] rounded-xl px-3 pt-2 pb-1.5 shadow-sm
                                            ${isMe
                                                ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-sm'
                                                : 'bg-[#202C33] text-[#e9edef] rounded-tl-sm'
                                            }
                                        `}>
                                            <p className="text-sm leading-relaxed break-words">{msg.text}</p>
                                            <div className="flex justify-end items-center gap-1 mt-0.5">
                                                <span className="text-[10px] text-slate-400/80">{msg.time}</span>
                                                {isMe && (
                                                    msg.status === 'read'
                                                        ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                                        : <Check className="w-3.5 h-3.5 text-slate-400/70" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="px-3 py-3 bg-[#202C33] border-t border-[#2A3942] flex items-center gap-2 flex-shrink-0">
                            <button className="text-slate-400 hover:text-[#25D366] p-2 rounded-full hover:bg-[#2A3942] transition-colors flex-shrink-0">
                                <Smile className="w-5 h-5" />
                            </button>
                            <button className="text-slate-400 hover:text-[#25D366] p-2 rounded-full hover:bg-[#2A3942] transition-colors flex-shrink-0">
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <div className="flex-1 bg-[#2A3942] rounded-xl px-4 py-2.5 focus-within:ring-1 focus-within:ring-[#25D366]/50 transition-all">
                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message"
                                    className="w-full bg-transparent text-slate-200 text-sm outline-none placeholder:text-slate-500"
                                />
                            </div>
                            <button
                                onClick={handleSendMessage}
                                className="w-10 h-10 bg-[#25D366] hover:bg-[#1DA851] rounded-full flex items-center justify-center text-[#111B21] transition-colors shadow-lg flex-shrink-0"
                            >
                                <Send className="w-4 h-4 ml-0.5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
                        <div className="w-24 h-24 bg-[#202C33] rounded-full flex items-center justify-center border border-[#2A3942]">
                            <User className="w-12 h-12 opacity-40" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-slate-300 mb-1">BulkNode CRM Inbox</h2>
                            <p className="text-sm">Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
