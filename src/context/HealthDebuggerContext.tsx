import React, { createContext, useContext, useEffect, useState } from 'react';

export interface HealthReport {
  timestamp: string;
  type: 'console-error' | 'console-warn' | 'react-error';
  message: string;
  stack?: string;
  details?: any;
}

interface HealthDebuggerContextType {
  logs: HealthReport[];
  clearLogs: () => void;
}

const HealthDebuggerContext = createContext<HealthDebuggerContextType | undefined>(undefined);

export const HealthDebuggerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<HealthReport[]>([]);

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const newLog: HealthReport = {
        timestamp: new Date().toISOString(),
        type: 'console-error',
        message: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
      };
      setTimeout(() => {
        setLogs(prev => [...prev, newLog]);
      }, 0);
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const newLog: HealthReport = {
        timestamp: new Date().toISOString(),
        type: 'console-warn',
        message: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
      };
      setTimeout(() => {
        setLogs(prev => [...prev, newLog]);
      }, 0);
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <HealthDebuggerContext.Provider value={{ logs, clearLogs: () => setLogs([]) }}>
      {children}
    </HealthDebuggerContext.Provider>
  );
};

export const useModuleHealthDebugger = (moduleName: string) => {
  const context = useContext(HealthDebuggerContext);
  if (!context) {
    throw new Error('useModuleHealthDebugger must be used within a HealthDebuggerProvider');
  }
  return {
    ...context,
    logs: context.logs, // Can filter by module later if we add moduleName to logs
  };
};
