import { useEffect } from 'react';

export interface HealthReport {
  timestamp: string;
  type: 'console-error' | 'console-warn' | 'react-error';
  message: string;
  stack?: string;
  details?: any;
}

// In-memory store for now, could be persisted to localstorage if needed
const healthLogs: HealthReport[] = [];

export const useAppHealthDebugger = () => {
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      healthLogs.push({
        timestamp: new Date().toISOString(),
        type: 'console-error',
        message: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
      });
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      healthLogs.push({
        timestamp: new Date().toISOString(),
        type: 'console-warn',
        message: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
      });
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return {
    getLogs: () => healthLogs,
    clearLogs: () => healthLogs.length = 0
  };
};
