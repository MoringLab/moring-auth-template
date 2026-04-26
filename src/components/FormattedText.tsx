'use client';

import React from 'react';

interface Props {
  text: string;
  className?: string;
}

const FormattedText: React.FC<Props> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by newlines to handle paragraphs
  const paragraphs = text.split('\n').filter(p => p.trim());

  return (
    <div className={`space-y-3 ${className}`}>
      {paragraphs.map((paragraph, idx) => {
        // Parse bold syntax **text**
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={idx} className="leading-relaxed text-inherit">
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                // Use a semi-transparent background for bold text to work on both dark/light
                return <strong key={i} className="font-bold bg-yellow-400/20 px-1 rounded">{part.slice(2, -2)}</strong>;
              }
              return <span key={i}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedText;
