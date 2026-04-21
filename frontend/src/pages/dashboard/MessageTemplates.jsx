import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Image as ImageIcon, FileText, MoreVertical, Zap } from 'lucide-react';

export default function MessageTemplates() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");
    const [newMessage, setNewMessage] = useState("");

    const mockTemplates = [
        { id: 1, name: "Eid Greeting Offer", text: "Salam [Name] bhai, Eid Mubarak! Enjoy special discounts on...", hasMedia: true, type: 'image' },
        { id: 2, name: "Monthly Payment Reminder", text: "Dear [Name], this is a reminder for your upcoming invoice of...", hasMedia: false },
        { id: 3, name: "New Product Catalog", text: "Hello [Company], we have attached our latest product catalog here.", hasMedia: true, type: 'pdf' }
    ];

    const handleVariableClick = (variable) => {
        setNewMessage(prev => prev + variable);
    };

    return (
        <div className="p-6 space-y-6 relative h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-4 shrink-0 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-[#25D366]" />
                        Message Templates
                    </h1>
                    <p className="text-slate-400 mt-1">Manage reusable message layouts with text and media.</p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-semibold border-0 w-full sm:w-auto"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create New Template
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {/* Blank Template Card */}
                <Card
                    onClick={() => setIsModalOpen(true)}
                    className="bg-transparent border-2 border-dashed border-[#2A3942] hover:border-[#25D366]/50 transition-colors flex flex-col items-center justify-center cursor-pointer min-h-[220px] group"
                >
                    <div className="w-12 h-12 rounded-full bg-[#202C33] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6 text-[#25D366]" />
                    </div>
                    <h3 className="text-white font-medium">Blank Template</h3>
                    <p className="text-slate-500 text-sm mt-1">Start from scratch</p>
                </Card>

                {/* Saved Templates */}
                {mockTemplates.map((template) => (
                    <Card key={template.id} className="bg-[#202C33] border-[#2A3942] hover:border-[#25D366]/30 transition-colors flex flex-col min-h-[220px]">
                        <div className="p-4 border-b border-[#2A3942] flex justify-between items-start">
                            <h3 className="text-white font-medium truncate pr-4">{template.name}</h3>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white -mr-2 -mt-2 h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <p className="text-slate-400 text-sm line-clamp-4 flex-1">
                                {template.text}
                            </p>
                            {template.hasMedia && (
                                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#25D366] bg-[#25D366]/10 w-fit px-2.5 py-1 rounded-md border border-[#25D366]/20">
                                    {template.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    Includes Media
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Create Template Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <Card className="relative bg-[#202C33] border-[#2A3942] w-full max-w-2xl shadow-2xl z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-[#2A3942]">
                            <div>
                                <h2 className="text-xl font-bold text-white">Create New Template</h2>
                                <p className="text-sm text-slate-400">Save a message structure to reuse across campaigns</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white hover:bg-[#111B21]">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Template Name</Label>
                                <Input
                                    placeholder="e.g. Follow-up Message Template"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    className="bg-[#111B21] border-[#2A3942] text-white focus-visible:ring-[#25D366]"
                                />
                            </div>

                            {/* Media Attachment in Template */}
                            <div className="space-y-2">
                                <Label className="text-slate-300">Attach Default Media (Image/File)</Label>
                                <div className="border border-dashed border-[#2A3942] rounded-xl p-6 flex flex-col items-center justify-center bg-[#111B21]/50 hover:bg-[#111B21] transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-[#202C33] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-5 h-5 text-[#25D366]" />
                                    </div>
                                    <p className="text-slate-300 font-medium text-sm">Upload media to include with template</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300 flex justify-between">
                                    Template Message
                                    <span className="text-xs text-slate-500">Variables automatically replace on send</span>
                                </Label>
                                <Textarea
                                    placeholder="Write your template logic here..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="bg-[#111B21] border-[#2A3942] text-white focus-visible:ring-[#25D366] min-h-[120px] resize-y"
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

                        </div>
                        <div className="p-6 border-t border-[#2A3942] flex justify-end gap-3 bg-[#111B21] rounded-b-xl">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white hover:bg-[#2a3942]">
                                Cancel
                            </Button>
                            <Button className="bg-[#25D366] hover:bg-[#1DA851] text-[#11B21] font-semibold">
                                Save Template
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
