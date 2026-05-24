import React, { useState } from 'react';
import { Copy, Check, ShieldAlert } from 'lucide-react';
import { formatAddress } from '../../utils/formatters';
import { useStore } from '../../store/useStore';

export default function AddressChip({ address, isEntity = false }) {
  const setSelectedAddress = useStore((state) => state.setSelectedAddress);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const [copied, setCopied] = useState(false);

  if (!address) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleInspect = (e) => {
    e.stopPropagation();
    setSelectedAddress(address);
    setActiveTab('aianalyst'); // Switch to AI Analyst for address lookup
  };

  return (
    <div 
      onClick={handleInspect}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-glass-border/10 border border-glass-border/30 hover:border-primary-container/40 hover:bg-glass-border/20 text-on-surface cursor-pointer group active:scale-98 transition-all font-code-md text-xs select-all"
    >
      {isEntity && <ShieldAlert size={12} className="text-secondary" />}
      <span className="text-text-1 group-hover:text-primary-container font-mono">{formatAddress(address)}</span>
      <button 
        onClick={handleCopy}
        className="p-0.5 rounded hover:bg-glass-border/40 text-on-surface-variant group-hover:text-on-surface transition-colors"
        title="Copy full address"
      >
        {copied ? (
          <Check size={11} className="text-emerald-500" />
        ) : (
          <Copy size={11} className="opacity-60 group-hover:opacity-100" />
        )}
      </button>
    </div>
  );
}
