import React, { useState } from 'react';
import { useModuleHealthDebugger } from '../context/HealthDebuggerContext';
import { AIModuleAuditor } from './AIModuleAuditor';
import { Bot, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';

interface Props {
  moduleName: string;
}

export const ModuleDiagnostics: React.FC<Props> = ({ moduleName }) => {
  const { logs, clearLogs } = useModuleHealthDebugger(moduleName);
  const [showAuditor, setShowAuditor] = useState(false);

  const errors = logs.filter(l => l.type === 'console-error' || l.type === 'react-error');
  const warnings = logs.filter(l => l.type === 'console-warn');

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" />
          تشخیص سلامت ماژول: {moduleName}
        </h3>
        <button 
          onClick={clearLogs}
          className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
        >
          <RefreshCcw size={12} /> پاکسازی
        </button>
      </div>
      
      <div className="flex gap-4">
        <div className="flex-1 bg-red-50 text-red-800 p-3 rounded text-xs">
          <strong>خطاها ({errors.length})</strong>
        </div>
        <div className="flex-1 bg-yellow-50 text-yellow-800 p-3 rounded text-xs">
          <strong>هشدارها ({warnings.length})</strong>
        </div>
      </div>

      {errors.length > 0 && (
        <button 
          onClick={() => setShowAuditor(!showAuditor)}
          className="w-full text-xs bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Bot size={14} /> {showAuditor ? 'بستن تحلیل' : 'تحلیل هوشمند خطاها'}
        </button>
      )}

      {showAuditor && (
        <div className="mt-2">
          <AIModuleAuditor 
            moduleName={moduleName} 
            subModules={[]}
            externalLogs={logs.map(l => ({ action: l.type, detail: l.message, timestamp: l.timestamp }))} 
          />
        </div>
      )}
    </div>
  );
};
