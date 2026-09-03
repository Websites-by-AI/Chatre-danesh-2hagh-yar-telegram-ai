import React, { useState } from 'react';
import { useModuleHealthDebugger } from '../context/HealthDebuggerContext';
import { Bot, AlertCircle, Copy, Check } from 'lucide-react';

interface Props {
  moduleName: string;
}

export const PageDiagnostics: React.FC<Props> = ({ moduleName }) => {
  const { logs } = useModuleHealthDebugger(moduleName);
  const [showPanel, setShowPanel] = useState(false);
  const [copied, setCopied] = useState(false);

  const errors = logs.filter(l => l.type === 'console-error' || l.type === 'react-error');
  
  const generatePrompt = () => {
    const errorSummary = errors.map(e => `${e.type}: ${e.message}`).join('\n');
    return `Analyze the following errors for module "${moduleName}" and suggest fixes:\n\n${errorSummary}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatePrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!showPanel ? (
        <button 
          onClick={() => setShowPanel(true)}
          className="bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-900"
        >
          <Bot size={20} />
        </button>
      ) : (
        <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-xl w-80 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold">تشخیص سلامت {moduleName}</h4>
            <button onClick={() => setShowPanel(false)} className="text-gray-500">×</button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {errors.length === 0 ? <p className="text-xs text-gray-500">همه چیز عالی است!</p> :
              errors.map((log, i) => (
                <div key={i} className="text-xs bg-red-50 text-red-800 p-2 rounded">
                  {log.message}
                </div>
              ))}
          </div>

          {errors.length > 0 && (
            <button 
              onClick={copyToClipboard}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 py-2 rounded text-xs hover:bg-slate-200"
            >
              {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              {copied ? 'کپی شد' : 'کپی پرامپت برای AI'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
