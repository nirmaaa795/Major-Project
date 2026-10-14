import React, { useState, useEffect } from 'react';
import {
  Terminal, Lock, Unlock, Eye, Volume2, VolumeX, ShieldAlert, Cpu, Database, Layers, CheckCircle2
} from 'lucide-react';
import { signInAnonymously, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { getUserOrganizationId, subscribeToOrgSettings } from './services/organizationService';
import { subscribeToOrgKeywords } from './services/keywordService';
import AdminDashboard from './components/AdminDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ChatWidget from './components/ChatWidget';

// Define your single designated Super Admin email
const SUPER_ADMIN_EMAIL = "nirmallouis7@gmail.com";

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'admin'
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [user, setUser] = useState(null);

  // Tenant / Organization Context
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [orgSettings, setOrgSettings] = useState(null);
  const [keywordsList, setKeywordsList] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(true);

  const [isMuted, setIsMuted] = useState(false);

  // Extract orgId parameter from query params (e.g., website.com/?org=acme)
  const getOrgIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('org') || params.get('orgId');
  };

  // Tactical Audio Effects
  const triggerAudioEffect = (type) => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'keystroke') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
      } else if (type === 'message-sent') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'message-received') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.08);
        gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'error') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.15);
      } else if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08);
        oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16);
        gainNode.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  };

  // Auth & Tenant Resolution
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Anonymous auth error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      const isPasswordAuth = firebaseUser?.providerData[0]?.providerId === "password";
      setIsAdminAuthenticated(isPasswordAuth);

      if (firebaseUser) {
        if (isPasswordAuth && firebaseUser.email !== SUPER_ADMIN_EMAIL) {
          // If logged in as Client Admin, resolve assigned organization ID from `users` collection[cite: 3]
          const orgId = await getUserOrganizationId(firebaseUser.uid);
          setActiveOrgId(orgId);
        } else {
          // Public visitor or Super Admin
          const urlOrg = getOrgIdFromUrl();
          setActiveOrgId(urlOrg || 'default_tenant');
        }
      }
      setGlobalLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to Active Organization Data
  useEffect(() => {
    if (!activeOrgId) return;

    const unsubscribeSettings = subscribeToOrgSettings(activeOrgId, (data) => {
      setOrgSettings(data);
    });

    const unsubscribeKeywords = subscribeToOrgKeywords(activeOrgId, (list) => {
      setKeywordsList(list);
    });

    return () => {
      unsubscribeSettings();
      unsubscribeKeywords();
    };
  }, [activeOrgId]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      setAdminEmail('');
      setAdminPassword('');
      setCurrentView('admin'); // Explicitly transition to admin view upon successful auth[cite: 1]
      triggerAudioEffect('success');
    } catch (error) {
      setLoginError("Invalid admin credentials.");
      triggerAudioEffect('error');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    await signInAnonymously(auth);
    setCurrentView("landing");
    triggerAudioEffect("keystroke");
  };

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-[#050505] text-[#39FF14] font-mono flex flex-col selection:bg-[#39FF14] selection:text-black relative overflow-x-hidden">

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(57,255,20,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(57,255,20,0.1)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#39FF14] to-transparent shadow-[0_0_12px_#39FF14]"></div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#39FF14]/30 px-4 py-3 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-black border border-[#39FF14] flex items-center justify-center">
              <Terminal className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider uppercase text-white flex items-center gap-2">
                {isSuperAdmin ? 'SUPER ADMIN PORTAL' : (orgSettings?.companyName || 'KEYBOT')} <span className="text-[#39FF14] text-xs px-2 py-0.5 border border-[#39FF14] rounded bg-black/40">SaaS v3.0</span>
              </h1>
              <p className="text-[10px] text-zinc-400 tracking-widest uppercase">
                {isSuperAdmin ? 'Global Control Center' : `Active Tenant: ${activeOrgId || 'Loading...'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => { setIsMuted(!isMuted); triggerAudioEffect('keystroke'); }}
              className="p-2 rounded border border-[#39FF14]/30 bg-zinc-950/60 hover:bg-[#39FF14]/10 transition-all text-zinc-300 hover:text-[#39FF14]"
              title={isMuted ? "Unmute Tactical SFX" : "Mute Tactical SFX"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {currentView === 'landing' ? (
              <button
                onClick={() => { setCurrentView('admin'); triggerAudioEffect('keystroke'); }}
                className="px-4 py-2 rounded bg-zinc-950 hover:bg-[#39FF14] border border-[#39FF14] text-[#39FF14] hover:text-black font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                Admin Dashboard
              </button>
            ) : (
              <button
                onClick={() => { setCurrentView('landing'); triggerAudioEffect('keystroke'); }}
                className="px-4 py-2 rounded bg-zinc-950 border border-[#39FF14]/50 text-white font-semibold text-xs tracking-wider uppercase transition-all flex items-center gap-2"
              >
                <Eye className="w-3.5 h-3.5" />
                Customer Preview
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col">

        {globalLoading && (
          <div className="flex-1 flex flex-col justify-center items-center gap-3 py-20">
            <div className="w-12 h-12 rounded border-2 border-t-transparent border-[#39FF14] animate-spin"></div>
            <p className="text-xs tracking-widest uppercase text-[#39FF14]/70 animate-pulse">Initializing System Context...</p>
          </div>
        )}

        {!globalLoading && currentView === 'landing' && (
          <div className="flex-1 flex flex-col gap-8 animate-fade-in">
            {/* Intro Banner */}
            <div className="relative overflow-hidden rounded-xl bg-zinc-950/60 backdrop-blur-md border border-[#39FF14]/30 p-8 lg:p-12 shadow-[0_0_30px_rgba(57,255,20,0.05)]">
              <div className="max-w-3xl">
                <span className="inline-block text-xs uppercase px-3 py-1 border border-[#39FF14]/40 bg-[#39FF14]/10 rounded mb-4 tracking-widest text-[#39FF14] font-semibold">
                  Tenant Node: {activeOrgId}
                </span>
                <h2 className="text-3xl lg:text-5xl font-black uppercase text-white tracking-tight mb-4">
                  {orgSettings?.companyName || 'KEYBOT'} <span className="text-[#39FF14]">SUPPORT PORTAL</span>
                </h2>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6">
                  Welcome to the official support portal for {orgSettings?.companyName || 'our company'}. Ask questions or interact with our automated assistant in the lower right floating window.
                </p>
              </div>
            </div>

            {/* Core Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-950/45 border border-zinc-800 p-6 rounded-lg">
                <Database className="w-6 h-6 text-[#39FF14] mb-3" />
                <h3 className="text-lg font-bold text-white uppercase mb-2">Isolated Database</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every company gets an isolated Firestore data sub-path protecting proprietary keywords and configurations.
                </p>
              </div>

              <div className="bg-zinc-950/45 border border-zinc-800 p-6 rounded-lg">
                <Layers className="w-6 h-6 text-[#39FF14] mb-3" />
                <h3 className="text-lg font-bold text-white uppercase mb-2">Multi-Tenant Routing</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Easily embed or share your unique link (<code className="text-[#39FF14]">?org={activeOrgId}</code>) to serve custom responses to visitors.
                </p>
              </div>

              <div className="bg-zinc-950/45 border border-zinc-800 p-6 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-[#39FF14] mb-3" />
                <h3 className="text-lg font-bold text-white uppercase mb-2">Seamless Fallback</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Unrecognized inputs trigger an instant WhatsApp redirect to your organization's support hotline.
                </p>
              </div>
            </div>
          </div>
        )}

        {!globalLoading && currentView === 'admin' && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in">
            {!isAdminAuthenticated ? (
              /* ADMIN LOGIN GATE */
              <div className="max-w-md w-full mx-auto bg-zinc-950/80 backdrop-blur-md border border-[#39FF14]/50 rounded-xl p-8 shadow-[0_0_40px_rgba(57,255,20,0.15)] my-12">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-black border border-[#39FF14] flex items-center justify-center text-[#39FF14] mb-3">
                    <Lock className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-wider text-white">Admin Authentication</h3>
                  <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">Multi-Tenant Portal Login</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-[#39FF14] mb-1 font-semibold">Admin Email</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full bg-black border border-[#39FF14]/50 focus:border-[#39FF14] text-white rounded px-4 py-3 text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-[#39FF14] mb-1 font-semibold">Password Key</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); triggerAudioEffect('keystroke'); }}
                      placeholder="•••••••••••••••"
                      className="w-full bg-black border border-[#39FF14]/50 focus:border-[#39FF14] text-white rounded px-4 py-3 text-sm outline-none"
                      required
                    />
                  </div>

                  {loginError && (
                    <div className="text-red-500 bg-red-950/40 border border-red-500/30 p-3 rounded text-xs flex items-center gap-2 font-bold animate-pulse">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 rounded bg-[#39FF14] hover:bg-emerald-400 text-black font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    Authenticate Access
                  </button>
                </form>
              </div>
            ) : isSuperAdmin ? (
              /* SUPER ADMIN GLOBAL DASHBOARD */
              <SuperAdminDashboard
                onLogout={handleLogout}
                triggerAudioEffect={triggerAudioEffect}
              />
            ) : (
              /* CLIENT TENANT ADMIN DASHBOARD */
              <AdminDashboard
                organizationId={activeOrgId}
                orgSettings={orgSettings}
                keywordsList={keywordsList}
                onLogout={handleLogout}
                triggerAudioEffect={triggerAudioEffect}
              />
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-900 bg-black/40 py-6 text-center text-[11px] text-zinc-500 select-none font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="uppercase tracking-widest">© 2026 {orgSettings?.companyName || 'KeyBot SaaS'} // MULTI-TENANT ARCHITECTURE</p>
          <p className="text-zinc-600">ISOLATED TENANT ENDPOINTS ACTIVE</p>
        </div>
      </footer>

      {/* FLOATING CHAT WIDGET (DELEGATED TO CUSTOM TENANT) */}
      {!isSuperAdmin && (
        <ChatWidget
          organizationId={activeOrgId}
          triggerAudioEffect={triggerAudioEffect}
        />
      )}

    </div>
  );
}