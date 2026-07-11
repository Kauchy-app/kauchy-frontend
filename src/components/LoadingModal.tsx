import React from 'react';

export default function LoadingModal() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-black/50 backdrop-blur-[4px] animate-[fadeIn_0.5s_ease-out_forwards]"></div>
      <div className="relative z-[10000] flex items-center justify-center animate-[scaleIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
        <div className="w-12 h-12 rounded-full border-[3px] border-white/20 border-t-indigo-400 animate-spin" />
      </div>
    </div>
  );
}
