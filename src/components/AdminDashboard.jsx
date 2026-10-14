import React, { useState } from 'react';
import { Terminal, Trash2, Database, Copy, Share2, Code } from 'lucide-react';
import KeywordForm from './KeywordForm';
import Settings from './Settings';
import { deleteOrgKeyword } from '../services/keywordService';

export default function AdminDashboard({ organizationId, orgSettings, keywordsList, onLogout, triggerAudioEffect }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteKeyword = async (id) => {
    try {
      await deleteOrgKeyword(organizationId, id);
      if (triggerAudioEffect) triggerAudioEffect('success');
    } catch (error) {
      console.error("Delete error:", error);
      if (triggerAudioEffect) triggerAudioEffect('error');
    }
  };

  const getShareableChatbotLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?org=${organizationId}`;
  };

  const getEmbedSnippet = () => {
    const chatUrl = getShareableChatbotLink();
    return `<iframe src="${chatUrl}" style="position: fixed; bottom: 20px; right: 20px; width: 380px; height: 520px; border: none; z-index: 999999; background: transparent;" allow="transparency"></iframe>`;
  };

  const filteredKeywords = keywordsList.filter(k =>
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 py-4 font-mono animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#39FF14]/30 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-white tracking-wider flex items-center gap-3">
            <Terminal className="w-6 h-6 text-[#39FF14]" />
            {orgSettings?.companyName || 'Organization'} Dashboard
          </h2>
          <p className="text-xs text-zinc-400 tracking-widest uppercase mt-1">
            Tenant ID: <span className="text-[#39FF14] font-bold">{organizationId}</span>
          </p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 border border-red-500/40 hover:bg-red-950/40 hover:border-red-500 text-red-400 rounded text-xs font-bold uppercase tracking-wider transition-all self-start md:self-auto"
        >
          Terminate Session [Logout]
        </button>
      </div>

      {/* Shareable Chatbot URL Banner */}
      <div className="bg-zinc-950/80 border border-[#39FF14]/40 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5 text-[#39FF14]" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Your Public Chatbot Endpoint</h4>
            <p className="text-[11px] text-zinc-400 font-mono">{getShareableChatbotLink()}</p>
          </div>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(getShareableChatbotLink());
            if (triggerAudioEffect) triggerAudioEffect('success');
            alert("Shareable chatbot URL copied to clipboard!");
          }}
          className="px-4 py-2 rounded bg-[#39FF14] hover:bg-emerald-400 text-black font-bold text-xs uppercase flex items-center gap-2 transition-all"
        >
          <Copy className="w-3.5 h-3.5" /> Copy Link
        </button>
      </div>

      {/* Website Embed Code Banner */}
      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Code className="w-5 h-5 text-[#39FF14]" />
          <div>
            <h4 className="text-xs font-bold text-white uppercase">Website Embed HTML Snippet</h4>
            <p className="text-[10px] text-zinc-400 font-mono truncate max-w-md">{getEmbedSnippet()}</p>
          </div>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(getEmbedSnippet());
            if (triggerAudioEffect) triggerAudioEffect('success');
            alert("Embed HTML snippet copied to clipboard!");
          }}
          className="px-4 py-2 rounded bg-zinc-900 border border-[#39FF14]/50 hover:bg-[#39FF14]/10 text-[#39FF14] font-bold text-xs uppercase flex items-center gap-2 transition-all"
        >
          <Copy className="w-3.5 h-3.5" /> Copy Embed Code
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Keyword Form & Settings */}
        <div className="lg:col-span-5 space-y-6">
          <KeywordForm
            organizationId={organizationId}
            existingKeywords={keywordsList}
            triggerAudioEffect={triggerAudioEffect}
          />
          <Settings
            organizationId={organizationId}
            currentSettings={orgSettings}
            triggerAudioEffect={triggerAudioEffect}
          />
        </div>

        {/* Right Side: Keywords Listing */}
        <div className="lg:col-span-7">
          <div className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-[0_0_25px_rgba(0,0,0,0.4)] h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 mb-4 gap-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-widest">Keyword Index Registry</h3>
                <p className="text-[10px] text-zinc-400 mt-0.5">Total registered entries: {keywordsList.length}</p>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter registry..."
                className="w-full sm:w-auto bg-black border border-zinc-800 focus:border-[#39FF14]/50 text-white rounded px-3 py-1.5 text-xs outline-none transition-all placeholder-zinc-700 font-mono"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[450px] pr-2 space-y-3 custom-scrollbar">
              {filteredKeywords.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded">
                  <Database className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                  <p className="text-xs uppercase tracking-widest">No matching keyword records found.</p>
                </div>
              ) : (
                filteredKeywords.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-black border border-zinc-800 hover:border-[#39FF14]/30 rounded-lg transition-all flex flex-col md:flex-row justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <span className="text-xs bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 px-2 py-0.5 rounded font-bold uppercase">
                        {item.keyword}
                      </span>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans pr-4 mt-2">{item.answer}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteKeyword(item.id)}
                      className="p-2 border border-zinc-800 hover:border-red-500 hover:bg-red-950/20 text-zinc-400 hover:text-red-400 rounded transition-all self-end md:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}