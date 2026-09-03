import React, { useState, useEffect } from "react";
import { Brain, Sparkles, CheckSquare, Square } from "lucide-react";
import { SystemLog } from "../types";
import { getSystemLogs } from "../lib/syslogs";
import { useModuleHealthDebugger } from "../context/HealthDebuggerContext";

export interface AIModuleAuditorProps {
  moduleName: string;
  subModules: string[];
  externalLogs?: SystemLog[];
}

export function AIModuleAuditor({ moduleName, subModules, externalLogs }: AIModuleAuditorProps) {
  const { logs: healthLogs } = useModuleHealthDebugger(moduleName);
  const [logs] = useState<SystemLog[]>(externalLogs || getSystemLogs().filter(log => log.action.includes(moduleName) || log.detail.includes(moduleName)));
  const [isAuditing, setIsAuditing] = useState(false);
  const [isProjectAuditing, setIsProjectAuditing] = useState(false);
  const [suggestion, setSuggestion] = useState<{ analysis: string; recommendations: string[]; riskLevel: string } | null>(null);
  const [selectedSubModules, setSelectedSubModules] = useState<string[]>(subModules);
  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<{ analysis: string; recommendations: string[]; riskLevel: string }[]>([]);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState<number>(-1);

  useEffect(() => {
	const savedHistory = localStorage.getItem(`audit_history_${moduleName}`);
	if (savedHistory) {
		const parsed = JSON.parse(savedHistory);
		setHistory(parsed);
		if (parsed.length > 0) setCurrentAnalysisIndex(parsed.length - 1);
	}
  }, [moduleName]);

  const toggleSubModule = (sm: string) => {
    setSelectedSubModules(prev => 
      prev.includes(sm) ? prev.filter(item => item !== sm) : [...prev, sm]
    );
  };

  const runAIAudit = async (type: "module" | "project", reanalyze: boolean = false) => {
    const isProject = type === "project";
    if (isProject) setIsProjectAuditing(true);
    else setIsAuditing(true);
    
    setSuggestion(null);
    try {
      const response = await fetch("/api/audit-module", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type,
          moduleName: isProject ? "ALL_PROJECT_STATUS" : moduleName, 
          logs, 
          healthLogs,
          selectedSubModules,
		  history: reanalyze ? history : [] 
        }),
      });
      const data = await response.json();
      setSuggestion(data.suggestion);
	  
	  const newHistory = [...history, data.suggestion];
	  setHistory(newHistory);
	  setCurrentAnalysisIndex(newHistory.length - 1);
	  localStorage.setItem(`audit_history_${moduleName}`, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Audit failed", error);
      setSuggestion("خطا در ارتباط با هوش مصنوعی برای بررسی.");
    } finally {
      if (isProject) setIsProjectAuditing(false);
      else setIsAuditing(false);
    }
  };

  return (
    <div className="border border-indigo-100 rounded-xl bg-indigo-50/30 p-2 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
          <Sparkles size={12} className="text-indigo-500" />
          تحلیل هوشمند
        </h3>
        <div className="flex gap-1">
            {history.length > 0 && (
                <button
                   onClick={() => {
                        const nextIndex = (currentAnalysisIndex - 1 + history.length) % history.length;
                        setCurrentAnalysisIndex(nextIndex);
                        setSuggestion(history[nextIndex]);
                   }}
                   className="text-[9px] px-1 bg-white border border-indigo-100 rounded text-slate-500"
                >◀</button>
            )}
            <button 
              onClick={() => runAIAudit("module", true)}
              disabled={isAuditing || selectedSubModules.length === 0}
              className="flex items-center gap-1 text-[9px] bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 font-bold transition disabled:bg-indigo-400"
            >
              <Brain size={10} />
              تحلیل دوباره
            </button>
            {history.length > 0 && (
                <button
                   onClick={() => {
                        const nextIndex = (currentAnalysisIndex + 1) % history.length;
                        setCurrentAnalysisIndex(nextIndex);
                        setSuggestion(history[nextIndex]);
                   }}
                   className="text-[9px] px-1 bg-white border border-indigo-100 rounded text-slate-500"
                >▶</button>
            )}
            <button
               onClick={() => setIsExpanded(!isExpanded)}
               className="text-[9px] px-1 bg-white border border-indigo-100 rounded text-slate-500"
            >
                {isExpanded ? "▲" : "▼"}
            </button>
        </div>
      </div>

      {isExpanded && subModules.length > 0 && (
        <div className="flex flex-wrap gap-1 text-[9px]">
          {subModules.map(sm => (
            <button
              key={sm}
              onClick={() => toggleSubModule(sm)}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border transition ${
                selectedSubModules.includes(sm) 
                  ? "bg-indigo-100 border-indigo-300 text-indigo-800" 
                  : "bg-white border-indigo-100 text-slate-500 hover:border-indigo-200"
              }`}
            >
              {selectedSubModules.includes(sm) ? <CheckSquare size={10} /> : <Square size={10} />}
              {sm}
            </button>
          ))}
        </div>
      )}

      {suggestion && typeof suggestion === 'string' && (
        <div className="absolute right-4 top-16 z-10 w-80 p-4 bg-white border border-amber-200 rounded-lg text-[11px] text-amber-950 shadow-xl space-y-2">
          <h4 className="font-bold border-b border-amber-100 pb-1">اعلان سامانه</h4>
          <p className="whitespace-pre-line">{suggestion}</p>
        </div>
      )}
      {suggestion && typeof suggestion === 'object' && (
        <div className="absolute right-4 top-16 z-10 w-80 p-4 bg-white border border-indigo-200 rounded-lg text-[11px] text-indigo-950 shadow-xl space-y-2">
          <h4 className="font-bold border-b border-indigo-100 pb-1">تحلیل فنی</h4>
          <p className="whitespace-pre-line">{suggestion.analysis || "تحلیلی ارائه نشد."}</p>
          
          <h4 className="font-bold border-b border-indigo-100 pb-1">پیشنهادها</h4>
          <ul className="list-disc pl-3">
            {(Array.isArray(suggestion.recommendations) ? suggestion.recommendations : []).map((rec, i) => <li key={i}>{rec}</li>)}
          </ul>
          
          <div className={`mt-2 px-2 py-1 rounded text-center text-[10px] font-bold ${
            suggestion.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
            suggestion.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
             سطح ریسک: {suggestion.riskLevel === 'high' ? 'بالا' : suggestion.riskLevel === 'medium' ? 'متوسط' : 'پایین'}
          </div>
        </div>
      )}
    </div>
  );
}
