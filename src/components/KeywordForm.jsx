import React, { useState } from 'react';
import { Plus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { addOrgKeyword } from '../services/keywordService';

export default function KeywordForm({ organizationId, existingKeywords, triggerAudioEffect }) {
  const [newKeyword, setNewKeyword] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleSaveKeyword = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newKeyword.trim() || !newAnswer.trim()) {
      setFormError('Both Keyword and Answer fields must be populated.');
      if (triggerAudioEffect) triggerAudioEffect('error');
      return;
    }

    const lowercaseKeyword = newKeyword.trim().toLowerCase();
    const isDuplicate = existingKeywords.some(k => k.keyword.toLowerCase() === lowercaseKeyword);

    if (isDuplicate) {
      setFormError(`Keyword '${lowercaseKeyword}' is already registered.`);
      if (triggerAudioEffect) triggerAudioEffect('error');
      return;
    }

    try {
      await addOrgKeyword(organizationId, lowercaseKeyword, newAnswer);
      setNewKeyword('');
      setNewAnswer('');
      setFormSuccess(`Keyword '${lowercaseKeyword}' saved successfully.`);
      if (triggerAudioEffect) triggerAudioEffect('success');
    } catch (error) {
      setFormError(`Write error: ${error.message}`);
      if (triggerAudioEffect) triggerAudioEffect('error');
    }
  };

  return (
    <div className="bg-zinc-950/80 backdrop-blur-md border border-[#39FF14]/40 rounded-xl p-6 shadow-[0_0_20px_rgba(57,255,20,0.05)]">
      <h3 className="text-base font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#39FF14]/20 pb-2 font-mono">
        <Plus className="w-4 h-4 text-[#39FF14]" />
        Register New Keyword
      </h3>

      <form onSubmit={handleSaveKeyword} className="space-y-4 font-mono">
        <div>
          <label className="block text-[11px] uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">Keyword / Prompt Trigger:</label>
          <input 
            type="text"
            value={newKeyword}
            onChange={(e) => { setNewKeyword(e.target.value); if (triggerAudioEffect) triggerAudioEffect('keystroke'); }}
            placeholder="e.g. pricing"
            className="w-full bg-black border border-[#39FF14]/30 focus:border-[#39FF14] text-[#39FF14] rounded px-3 py-2 text-sm outline-none transition-all placeholder-zinc-700 font-mono"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-widest text-zinc-400 mb-1.5 font-bold">Bot Response:</label>
          <textarea 
            rows="4"
            value={newAnswer}
            onChange={(e) => { setNewAnswer(e.target.value); if (triggerAudioEffect) triggerAudioEffect('keystroke'); }}
            placeholder="Enter the automated response..."
            className="w-full bg-black border border-[#39FF14]/30 focus:border-[#39FF14] text-white rounded px-3 py-2 text-sm outline-none transition-all placeholder-zinc-700 font-sans"
            required
          ></textarea>
        </div>

        {formError && (
          <div className="text-red-500 bg-red-950/40 border border-red-500/30 p-3 rounded text-xs font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        <button 
          type="submit"
          className="w-full py-2.5 rounded bg-black border-2 border-[#39FF14] hover:bg-[#39FF14] text-[#39FF14] hover:text-black font-bold uppercase text-xs tracking-widest transition-all duration-300"
        >
          Save Keyword
        </button>
      </form>
    </div>
  );
}