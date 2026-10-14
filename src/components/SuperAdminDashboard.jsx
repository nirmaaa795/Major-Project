import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Trash2, Edit3, Save, X, Terminal } from 'lucide-react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function SuperAdminDashboard({ onLogout, triggerAudioEffect }) {
    const [usersList, setUsersList] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [newUid, setNewUid] = useState('');
    const [newOrgId, setNewOrgId] = useState('');

    const [editingUid, setEditingUid] = useState(null);
    const [editOrgId, setEditOrgId] = useState('');

    // Fetch all users from Firestore
    useEffect(() => {
        const usersRef = collection(db, 'users');
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
            const list = snapshot.docs.map((doc) => ({
                uid: doc.id,
                ...doc.data()
            }));
            setUsersList(list);
        });
        return () => unsubscribe();
    }, []);

    // Add new tenant user mapping
    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!newUid.trim() || !newOrgId.trim()) return;

        try {
            await setDoc(doc(db, 'users', newUid.trim()), {
                email: newEmail.trim() || 'N/A',
                organizationId: newOrgId.trim().toLowerCase(),
                role: 'admin',
                createdAt: new Date().toISOString()
            });

            setNewEmail('');
            setNewUid('');
            setNewOrgId('');
            if (triggerAudioEffect) triggerAudioEffect('success');
            alert('New tenant user added successfully!');
        } catch (err) {
            console.error('Error adding user:', err);
            if (triggerAudioEffect) triggerAudioEffect('error');
        }
    };

    // Delete tenant user mapping
    const handleDeleteUser = async (uid) => {
        if (!window.confirm('Are you sure you want to remove this tenant access?')) return;
        try {
            await deleteDoc(doc(db, 'users', uid));
            if (triggerAudioEffect) triggerAudioEffect('success');
        } catch (err) {
            console.error('Error deleting user:', err);
            if (triggerAudioEffect) triggerAudioEffect('error');
        }
    };

    // Save edited Organization ID
    const handleSaveEdit = async (uid) => {
        try {
            await setDoc(doc(db, 'users', uid), { organizationId: editOrgId.trim().toLowerCase() }, { merge: true });
            setEditingUid(null);
            if (triggerAudioEffect) triggerAudioEffect('success');
        } catch (err) {
            console.error('Error updating user:', err);
            if (triggerAudioEffect) triggerAudioEffect('error');
        }
    };

    return (
        <div className="space-y-8 py-4 font-mono animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-red-500/40 pb-4 gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase text-white tracking-wider flex items-center gap-3">
                        <Shield className="w-6 h-6 text-red-500 animate-pulse" />
                        Super Admin Portal
                    </h2>
                    <p className="text-xs text-zinc-400 tracking-widest uppercase mt-1">
                        Global Tenant Management
                    </p>
                </div>
                <button
                    onClick={onLogout}
                    className="px-4 py-2 border border-red-500/40 hover:bg-red-950/40 hover:border-red-500 text-red-400 rounded text-xs font-bold uppercase tracking-wider transition-all"
                >
                    Terminate Session [Logout]
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Create User Form */}
                <div className="lg:col-span-5 bg-zinc-950/80 backdrop-blur-md border border-red-500/40 rounded-xl p-6">
                    <h3 className="text-base font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-red-500/20 pb-2">
                        <UserPlus className="w-4 h-4 text-red-500" /> Register New Tenant Admin
                    </h3>

                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div>
                            <label className="block text-[11px] uppercase text-zinc-400 mb-1 font-bold">Firebase Auth UID:</label>
                            <input
                                type="text"
                                value={newUid}
                                onChange={(e) => setNewUid(e.target.value)}
                                placeholder="Paste UID from Firebase Auth"
                                className="w-full bg-black border border-zinc-800 focus:border-red-500 text-white rounded px-3 py-2 text-xs outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] uppercase text-zinc-400 mb-1 font-bold">Admin Email:</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="admin@clientcompany.com"
                                className="w-full bg-black border border-zinc-800 focus:border-red-500 text-white rounded px-3 py-2 text-xs outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] uppercase text-zinc-400 mb-1 font-bold">Assigned Organization ID:</label>
                            <input
                                type="text"
                                value={newOrgId}
                                onChange={(e) => setNewOrgId(e.target.value)}
                                placeholder="e.g. acme_corp"
                                className="w-full bg-black border border-zinc-800 focus:border-red-500 text-[#39FF14] rounded px-3 py-2 text-xs outline-none"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-2.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold uppercase text-xs tracking-widest transition-all"
                        >
                            Provision Tenant Access
                        </button>
                    </form>
                </div>

                {/* Right Side: Users Directory */}
                <div className="lg:col-span-7 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-base font-bold text-white uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">
                        Active Registered Admins ({usersList.length})
                    </h3>

                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {usersList.map((usr) => (
                            <div key={usr.uid} className="p-4 bg-black border border-zinc-800 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-white">{usr.email}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">UID: {usr.uid}</p>

                                    {editingUid === usr.uid ? (
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={editOrgId}
                                                onChange={(e) => setEditOrgId(e.target.value)}
                                                className="bg-zinc-900 border border-red-500 text-[#39FF14] px-2 py-1 text-xs rounded outline-none"
                                            />
                                            <button onClick={() => handleSaveEdit(usr.uid)} className="p-1 text-emerald-400 hover:text-white"><Save className="w-4 h-4" /></button>
                                            <button onClick={() => setEditingUid(null)} className="p-1 text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <span className="inline-block text-[10px] bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 px-2 py-0.5 rounded font-bold mt-1">
                                            Org: {usr.organizationId}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 self-end md:self-auto">
                                    <button
                                        onClick={() => { setEditingUid(usr.uid); setEditOrgId(usr.organizationId); }}
                                        className="p-2 border border-zinc-800 hover:border-zinc-500 text-zinc-400 hover:text-white rounded"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(usr.uid)}
                                        className="p-2 border border-zinc-800 hover:border-red-500 text-zinc-400 hover:text-red-400 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}