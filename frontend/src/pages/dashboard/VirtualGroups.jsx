import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RefreshCw, Users, Plus, Smartphone, MoreHorizontal, UserPlus, Search } from 'lucide-react';

export default function VirtualGroups() {
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [searchContact, setSearchContact] = useState("");
    const [searchGroup, setSearchGroup] = useState("");

    // Mock Data
    const activeAccount = "+880 1309-831316";

    const mockGroups = [
        { id: 1, name: "Chuadanga VIP Dealers", count: 45 },
        { id: 2, name: "Jessore Retailers", count: 120 },
        { id: 3, name: "Internal Sales Team", count: 15 }
    ];

    const mockContacts = [
        { id: 1, name: "Anisur Rahman", phone: "+880 1711-000000", tag: "Dealer" },
        { id: 2, name: "Ruhul Amin", phone: "+880 1612-111111", tag: "Retailer" },
        { id: 3, name: "Suman Kumar", phone: "+880 1913-222222", tag: "Wholesale" },
        { id: 4, name: "Tariqul Islam", phone: "+880 1514-333333", tag: "New" },
        { id: 5, name: "Kamal Hossain", phone: "+880 1315-444444", tag: "Dealer" },
    ];

    const toggleSelectAll = (checked) => {
        if (checked) {
            setSelectedContacts(mockContacts.map(c => c.id));
        } else {
            setSelectedContacts([]);
        }
    };

    const toggleContact = (id) => {
        setSelectedContacts(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const filteredContacts = mockContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchContact.toLowerCase()) ||
        contact.phone.includes(searchContact)
    );

    const filteredGroups = mockGroups.filter(group =>
        group.name.toLowerCase().includes(searchGroup.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 relative h-[calc(100vh-5rem)] overflow-hidden flex flex-col">
            {/* Header Area */}
            <div className="flex flex-col gap-2 shrink-0">
                <h1 className="text-2xl font-bold text-white tracking-tight">Virtual Groups & Contacts</h1>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#25D366]/10 border border-[#25D366]/20 rounded-full w-fit">
                    <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                    <span className="text-sm font-medium text-[#25D366]">
                        Currently viewing data for active account: {activeAccount}
                    </span>
                </div>
            </div>

            {/* Tabs Area */}
            <Tabs defaultValue="contacts" className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center shrink-0 mb-4 border-b border-[#2A3942] pb-4">
                    <TabsList className="bg-[#111B21] border border-[#2A3942] p-1">
                        <TabsTrigger
                            value="groups"
                            className="data-[state=active]:bg-[#202C33] data-[state=active]:text-white text-slate-400"
                        >
                            Virtual Groups
                        </TabsTrigger>
                        <TabsTrigger
                            value="contacts"
                            className="data-[state=active]:bg-[#202C33] data-[state=active]:text-white text-slate-400"
                        >
                            All Contacts
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Contacts Tab Content */}
                <TabsContent value="contacts" className="flex-1 overflow-auto m-0 outline-none relative bg-[#202C33] rounded-xl border border-[#2A3942] flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b border-[#2A3942] shrink-0">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Device Contacts</h2>
                            <p className="text-sm text-slate-400">Total {mockContacts.length} contacts found on device</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={searchContact}
                                    onChange={(e) => setSearchContact(e.target.value)}
                                    className="pl-9 w-64 bg-[#111B21] border-[#2A3942] text-white focus-visible:ring-[#25D366]"
                                />
                            </div>
                            <Button className="bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-semibold border-0">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Sync from WhatsApp
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-[#2A3942] hover:bg-transparent">
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedContacts.length === mockContacts.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="border-[#2A3942] bg-[#111B21] text-[#25D366] data-[state=checked]:bg-[#25D366] data-[state=checked]:text-[#111B21]"
                                        />
                                    </TableHead>
                                    <TableHead className="text-slate-400">Name</TableHead>
                                    <TableHead className="text-slate-400">Phone Number</TableHead>
                                    <TableHead className="text-slate-400">Label/Tag</TableHead>
                                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContacts.map((contact) => (
                                    <TableRow key={contact.id} className="border-[#2A3942] hover:bg-[#111B21]/50">
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedContacts.includes(contact.id)}
                                                onCheckedChange={() => toggleContact(contact.id)}
                                                className="border-[#2A3942] bg-[#111B21] text-[#25D366] data-[state=checked]:bg-[#25D366] data-[state=checked]:text-[#111B21]"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium text-white">{contact.name}</TableCell>
                                        <TableCell className="text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="w-4 h-4 text-[#25D366]" />
                                                {contact.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20">
                                                {contact.tag}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Floating Action Bar */}
                    {selectedContacts.length > 0 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#202C33] p-3 rounded-2xl border border-[#25D366]/30 shadow-[0_8px_30px_rgb(0,0,0,0.4)] shadow-[#25D366]/10 animate-in slide-in-from-bottom-5">
                            <div className="px-4 py-2 bg-[#111B21] rounded-xl border border-[#2A3942]">
                                <span className="font-semibold text-[#25D366] text-lg">{selectedContacts.length}</span>
                                <span className="text-slate-400 ml-2">selected</span>
                            </div>

                            <Select>
                                <SelectTrigger className="w-[200px] bg-[#111B21] border-[#2A3942] text-slate-300 focus:ring-[#25D366]">
                                    <SelectValue placeholder="Select Destination Group" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#202C33] border-[#2A3942] text-slate-300">
                                    {mockGroups.map(group => (
                                        <SelectItem key={group.id} value={group.id.toString()} className="hover:bg-[#111B21] focus:bg-[#111B21]">
                                            {group.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button className="bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-semibold border-0">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add to Group
                            </Button>
                        </div>
                    )}
                </TabsContent>

                {/* Groups Tab Content */}
                <TabsContent value="groups" className="flex-1 m-0 outline-none overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">Your Target Audiences</h2>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search groups..."
                                    value={searchGroup}
                                    onChange={(e) => setSearchGroup(e.target.value)}
                                    className="pl-9 w-64 bg-[#202C33] border-[#2A3942] text-white focus-visible:ring-[#25D366]"
                                />
                            </div>
                            <Button className="bg-[#25D366] hover:bg-[#1DA851] text-[#111B21] font-semibold border-0">
                                <Plus className="w-5 h-5 mr-2" />
                                Create New Group
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                        {filteredGroups.map((group) => (
                            <Card key={group.id} className="bg-[#202C33] border-[#2A3942] hover:border-[#25D366]/50 transition-colors">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/20">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <CardTitle className="text-xl text-white mt-4">{group.name}</CardTitle>
                                    <CardDescription className="text-slate-400">Target Segment</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-bold text-[#25D366]">{group.count}</span>
                                        <span className="text-slate-400 font-medium">Synced Contacts</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-[#111B21] border-t border-[#2A3942] px-6 py-4">
                                    <Button variant="outline" className="w-full bg-transparent border-[#2A3942] text-slate-300 hover:text-white hover:bg-[#2A3942] hover:border-transparent">
                                        View Members
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
