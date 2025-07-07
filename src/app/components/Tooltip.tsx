// src/app/components/Tooltip.tsx
'use client';

import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  text: string;
}

export default function Tooltip({ children, text }: TooltipProps) {
  return (
    <div className="relative group flex items-center">
      {children}
      <div className="absolute bottom-full mb-2 w-max bg-gray-800 text-white text-xs rounded-md py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {text}
      </div>
    </div>
  );
}