import React, { useEffect, useRef, useState } from 'react';
import { usePrefs } from '../contexts/PrefsContext';
import './CommandPalette.css';

const CommandPalette = ({ open, onClose, onRun }) => {
  const { commandHistory, addCommandHistory } = usePrefs();
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose?.();
    if (e.key === 'Enter') {
      const cmd = input.trim();
      if (cmd) {
        addCommandHistory(cmd);
        onRun?.(cmd);
        onClose?.();
      }
    }
  };

  if (!open) return null;

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command, e.g. /search error or /status busy"
          className="cp-input"
        />
        {commandHistory.length > 0 && (
          <div className="cp-history">
            Recent: {commandHistory.slice(0,5).join(' • ')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandPalette;
