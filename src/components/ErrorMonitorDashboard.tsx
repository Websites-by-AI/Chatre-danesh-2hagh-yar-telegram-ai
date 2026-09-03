import React, { useState, useEffect } from "react";
import { AlertCircle, Brain, Copy, RefreshCw, Terminal } from "lucide-react";
import { getSystemLogs } from "../lib/syslogs";
import { SystemLog } from "../types";
import { AIModuleAuditor } from "./AIModuleAuditor";

export function ErrorMonitorDashboard() {
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    setLogs(getSystemLogs());
  }, []);

  const refreshLogs = () => {
    setLogs(getSystemLogs());
  };

  const errorLogs = logs.filter(log => log.action.includes("[ERROR]"));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="text-red-500" />
          مانیتورینگ خطاهای پرتال
        </h2>
        <div className="flex gap-2">
           <AIModuleAuditor moduleName="ErrorMonitor" subModules={["لیست خطا"]} externalLogs={errorLogs} />
          <button onClick={refreshLogs} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {errorLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl">خطایی یافت نشد.</div>
        ) : (
          errorLogs.map(log => (
            <div key={log.id} className="p-4 bg-white border border-red-100 rounded-xl shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">{log.action.replace("[ERROR] ", "")}</span>
                <span className="text-[10px] text-slate-400">{log.timestamp}</span>
              </div>
              <p className="text-sm text-slate-700">{log.detail}</p>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
