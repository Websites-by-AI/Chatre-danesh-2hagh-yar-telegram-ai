import React, { useState, useEffect } from "react";
import { Eye, Printer, Trash2, FileText, Plus, Check, ShieldAlert } from "lucide-react";
import { Student } from "../../types";

interface InterviewRecorderProps {
  student: Student;
  role: string | null;
  onLogSystem?: (action: string, user: string, details: string) => void;
}

const toPersianNum = (n: number | string): string => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function InterviewRecorder({ student, role, onLogSystem }: InterviewRecorderProps) {
  const [interviews, setInterviews] = useState<any[]>(() => {
    const saved = localStorage.getItem(`taranom_psychology_interviews_${student.id}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      {
        id: "INT-304",
        date: "۱۴۰۶/۰۳/۰۵",
        title: "بررسی افت ساعت مطالعه و خستگی حاد مفرط",
        symptoms: ["افت ساعت مطالعه", "بی‌قراری و تنش فیزیکی", "فرسودگی و کلافگی شدید"],
        notes: "در مصاحبه حضوری مشخص شد داوطلب به علت فشار مستمر هفته‌های پایانی منتهی به آزمون جامع دچار خستگی حاد چشم و کاهش انگیزه گردیده است. ساعت خواب شبانه او به ۵ ساعت افت کرده است.",
        diagnosis: "خستگی مزمن ذهن و فرسودگی تحصیلی دور پایانی (Burnout)",
        prescriptions: [
          "اجرای روزانه ۲ نوبت تنفس تعاملی بیوفیدبک ۴ ثانیه‌ای",
          "کاهش ساعت مطالعه تجمعی به ۱۰ ساعت برای ایجاد بازیابی ذهنی",
          "مصرف دمنوش بادرنجبویه شبانه جهت تثبیت فاکتور خواب"
        ],
        severity: "warning"
      }
    ];
  });

  const [observeTitle, setObserveTitle] = useState("");
  const [observeNotes, setObserveNotes] = useState("");
  const [observeDiagnosis, setObserveDiagnosis] = useState("");
  const [observeSeverity, setObserveSeverity] = useState<"critical" | "warning" | "mild">("warning");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customPrescripts, setCustomPrescripts] = useState<string[]>([]);
  const [newPrescriptText, setNewPrescriptText] = useState("");
  const [printPreviewInterview, setPrintPreviewInterview] = useState<any | null>(null);

  useEffect(() => {
    localStorage.setItem(`taranom_psychology_interviews_${student.id}`, JSON.stringify(interviews));
  }, [interviews, student.id]);

  if (role !== "counselor" && role !== "admin" && role !== "teacher") {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert size={28} />
        </div>
        <h3 className="text-lg font-black text-slate-900">دسترسی محدود به کارتابل رسمی مشاور</h3>
        <p className="text-xs text-slate-550 font-bold leading-relaxed">این میز پایش صرفاً جهت ثبت مصاحبه‌های عصب‌شناختی و مداخلات بالینی مربیان طراحی شده است.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left: History list */}
      <div className="lg:col-span-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-rose-500" />
            <h3 className="text-xs font-black text-slate-900">سوابق پرونده‌های روان‌شناختی</h3>
          </div>
          <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{toPersianNum(interviews.length)} مورد</span>
        </div>

        <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
          {interviews.map((item) => (
            <div key={item.id} className={`bg-white border rounded-2xl p-4 transition-all ${item.severity === "critical" ? "border-red-200" : item.severity === "warning" ? "border-amber-200" : "border-slate-150"}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400">{item.id} | {item.date}</span>
                  <h4 className="text-xs font-black text-indigo-950 pt-1">{item.title}</h4>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setPrintPreviewInterview(item)} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-150"><Printer size={13} /></button>
                  <button onClick={() => setInterviews(interviews.filter(it => it.id !== item.id))} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-150"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="mt-3 bg-slate-50 p-3 rounded-xl text-[11px] text-slate-600 font-semibold">{item.diagnosis}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Logger Form */}
      <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-150 shadow-md space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText size={18} className="text-rose-500" />
          <h3 className="text-xs font-black text-slate-900">ثبت مصاحبه و نسخه روان‌شناختی</h3>
        </div>

        <div className="space-y-4 text-right">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500">موضوع مصاحبه:</label>
            <input type="text" value={observeTitle} onChange={e => setObserveTitle(e.target.value)} className="w-full p-3 border border-slate-150 rounded-xl text-xs font-black bg-slate-50" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500">نشانه‌ها:</label>
            <div className="grid grid-cols-2 gap-2">
              {["افت ساعت مطالعه", "بی‌قراری", "وسواس تکرار", "سرزنش شخصی", "ترس از غلط", "خستگی چشم"].map(sym => (
                <button 
                  key={sym} 
                  onClick={() => selectedSymptoms.includes(sym) ? setSelectedSymptoms(selectedSymptoms.filter(x => x !== sym)) : setSelectedSymptoms([...selectedSymptoms, sym])}
                  className={`p-2.5 rounded-xl border text-[10px] font-black ${selectedSymptoms.includes(sym) ? "bg-rose-500 text-white border-rose-500" : "bg-slate-50 border-slate-150"}`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500">ملاحظات و تشخیص:</label>
            <textarea rows={4} value={observeNotes} onChange={e => setObserveNotes(e.target.value)} className="w-full p-3 border border-slate-150 rounded-xl text-xs font-semibold bg-slate-50" />
          </div>

          <button 
            onClick={() => {
              if (!observeTitle || !observeNotes) return;
              const newRecord = {
                id: `INT-${Math.floor(100 + Math.random() * 900)}`,
                date: "امروز",
                title: observeTitle,
                symptoms: selectedSymptoms,
                diagnosis: observeDiagnosis || "تشخیص عمومی",
                notes: observeNotes,
                prescriptions: customPrescripts,
                severity: observeSeverity
              };
              setInterviews([newRecord, ...interviews]);
              setObserveTitle(""); setObserveNotes(""); setCustomPrescripts([]);
              if (onLogSystem) onLogSystem("ثبت مصاحبه", student.name, newRecord.title);
            }}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md"
          >
            ثبت نهایی پرونده
          </button>
        </div>
      </div>
    </div>
  );
}
