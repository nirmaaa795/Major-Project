import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Phone, Bot, Building2 } from 'lucide-react';
import { updateOrgSettings } from '../services/organizationService';

export default function Settings({ organizationId, currentSettings, triggerAudioEffect }) {
  const [companyName, setCompanyName] = useState('');
  const [botName, setBotName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  useEffect(() => {
    if (currentSettings) {
      setCompanyName(currentSettings.companyName || 'Match-Bot');
      setBotName(currentSettings.botName || 'Match-Bot');
      setWhatsappNumber(currentSettings.whatsappNumber || '1234567890');
    }
  }, [currentSettings]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setSettingsSuccess('');
    try {
      await updateOrgSettings(organizationId, {
        companyName: companyName.trim(),
        botName: botName.trim(),
        whatsappNumber: whatsappNumber.trim()
      });
      setSettingsSuccess('Organization branding updated!');
      if (triggerAudioEffect) triggerAudioEffect('success');
    } catch (error) {
      console.error('Settings save error:', error);
      if (triggerAudioEffect) triggerAudioEffect('error');
    }
  };

  return (
    <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 font-mono">
      <h3 className="text-base font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
        <SettingsIcon className="w-4 h-4 text-emerald-400" />
        Organization Configuration
      </h3>

      <form onSubmit={handleUpdateSettings} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-zinc-400 mb-1 font-bold">Company / Brand Name:</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={companyName}
              onChange={(e) => { setCompanyName(e.target.value); if (triggerAudioEffect) triggerAudioEffect('keystroke'); }}
              placeholder="e.g. Acme Corp"
              className="w-full bg-black border border-zinc-800 focus:border-[#39FF14]/50 text-white rounded pl-9 pr-3 py-2 text-sm outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-widest text-zinc-400 mb-1 font-bold">Chatbot Display Name:</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={botName}
              onChange={(e) => { setBotName(e.target.value); if (triggerAudioEffect) triggerAudioEffect('keystroke'); }}
              placeholder="e.g. Support_Bot"
              className="w-full bg-black border border-zinc-800 focus:border-[#39FF14]/50 text-[#39FF14] rounded pl-9 pr-3 py-2 text-sm outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-widest text-zinc-400 mb-1 font-bold">WhatsApp Support Phone:</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => { setWhatsappNumber(e.target.value); if (triggerAudioEffect) triggerAudioEffect('keystroke'); }}
              placeholder="e.g. 15551234567"
              className="w-full bg-black border border-zinc-800 focus:border-[#39FF14]/50 text-[#39FF14] rounded pl-9 pr-3 py-2 text-sm outline-none"
              required
            />
          </div>
        </div>

        {settingsSuccess && (
          <div className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-2 rounded text-[11px] font-bold">
            {settingsSuccess}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2 rounded bg-zinc-900 border border-zinc-700 hover:border-emerald-400 text-white font-bold uppercase text-[10px] tracking-widest transition-all"
        >
          Apply Configuration
        </button>
      </form>
    </div>
  );
}