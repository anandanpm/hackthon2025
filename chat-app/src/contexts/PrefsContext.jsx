import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const PrefsContext = createContext();

export const usePrefs = () => {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used within a PrefsProvider');
  return ctx;
};

export const PrefsProvider = ({ children }) => {
  const [isDnd, setIsDnd] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);

  useEffect(() => {
    const d = localStorage.getItem('prefs.isDnd');
    const h = localStorage.getItem('prefs.commandHistory');
    if (d != null) setIsDnd(d === 'true');
    if (h) {
      try { setCommandHistory(JSON.parse(h)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('prefs.isDnd', String(isDnd));
  }, [isDnd]);

  useEffect(() => {
    localStorage.setItem('prefs.commandHistory', JSON.stringify(commandHistory.slice(0, 50)));
  }, [commandHistory]);

  const value = useMemo(() => ({
    isDnd,
    setIsDnd,
    commandHistory,
    addCommandHistory: (cmd) => setCommandHistory((prev) => [cmd, ...prev].slice(0, 50)),
  }), [isDnd, commandHistory]);

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
};
