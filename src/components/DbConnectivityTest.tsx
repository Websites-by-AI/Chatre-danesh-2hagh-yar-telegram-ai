
import { useState } from 'react';
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Zap } from 'lucide-react';

export default function DbConnectivityTest() {
  const [status, setStatus] = useState<string>("آماده تست");
  const [data, setData] = useState<any>(null);

  const runTest = async () => {
    setStatus("درحال تست اتصال...");
    setData(null);
    try {
      if (!db) {
        throw new Error('Firestore client not initialized');
      }

      // Write Test
      const testDocRef = doc(db, 'system_tests', 'connection_status');
      const payload = { 
        lastTested: new Date().toISOString(), 
        status: "active",
        agent: "taranom_mehr_ai"
      };
      await setDoc(testDocRef, payload);
      
      // Read Test
      const snapshot = await getDoc(testDocRef);
      if (!snapshot.exists()) {
        throw new Error('فایل تست ایجاد نشد');
      }

      setStatus("✅ اتصال دیتابیس Firestore موفقیت‌آمیز");
      setData(snapshot.data());
    } catch (error: any) {
      console.error(error);
      setStatus("❌ خطای اتصال: " + error.message);
      handleFirestoreError(error, OperationType.WRITE, "system_tests/connection_status");
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 text-right">
      <h3 className="font-bold text-slate-800 mb-2">تست سلامت دیتابیس</h3>
      <button 
        onClick={runTest}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
      >
        <Zap size={14} /> تست اتصال (Read/Write)
      </button>
      <p className="mt-2 text-xs text-slate-600">وضعیت: {status}</p>
      {data && <pre className="mt-2 p-2 bg-slate-100 text-[10px] rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
