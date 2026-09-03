import React, { useState } from "react";
import { Search, Plus, Edit3, Trash2, Database, School, Users, GraduationCap, MapPin, Activity, SearchIcon } from "lucide-react";
import { Student } from "../../types";
import { SchoolProfile } from "../../lib/dataService";

interface CentralDatabaseProps {
  schoolsDb: SchoolProfile[];
  counselorsDb: any[];
  teachersDb: any[];
  studentsDbList: Student[];
  dbSearchTerm: string;
  setDbSearchTerm: (val: string) => void;
  onDeleteSchool: (id: string, name: string) => void;
  onDeleteCounselor: (id: string, name: string) => void;
  onDeleteTeacher: (id: string, name: string) => void;
  onDeleteStudent: (id: string, name: string) => void;
  onEditSchool: (sc: SchoolProfile) => void;
  onEditCounselor: (co: any) => void;
  onEditTeacher: (te: any) => void;
  onEditStudent: (st: Student) => void;
  onAddNew: (type: "schools" | "counselors" | "teachers" | "students") => void;
}

const toPersianNum = (n: number | string): string => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function CentralDatabase({
  schoolsDb, counselorsDb, teachersDb, studentsDbList,
  dbSearchTerm, setDbSearchTerm,
  onDeleteSchool, onDeleteCounselor, onDeleteTeacher, onDeleteStudent,
  onEditSchool, onEditCounselor, onEditTeacher, onEditStudent,
  onAddNew
}: CentralDatabaseProps) {
  const [dbSubTab, setDbSubTab] = useState<"schools" | "counselors" | "teachers" | "students">("schools");

  return (
    <div className="space-y-6" id="admin-tab-central-database">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Database size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">بانک اطلاعاتی متمرکز ترنم مهر</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Central Multi-Tenant Infrastructure DB</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {[
            { id: "schools", label: "مدارس", icon: School },
            { id: "counselors", label: "مشاوران", icon: Users },
            { id: "teachers", label: "دبیران", icon: GraduationCap },
            { id: "students", label: "داوطلبان", icon: MapPin }
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setDbSubTab(sub.id as any)}
              className={`px-5 py-2 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 ${
                dbSubTab === sub.id ? "bg-white text-indigo-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <sub.icon size={14} />
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={`جستجو در ${dbSubTab === "schools" ? "مدارس" : dbSubTab === "counselors" ? "مشاوران" : dbSubTab === "teachers" ? "دبیران" : "داوطلبان"}...`}
              value={dbSearchTerm}
              onChange={(e) => setDbSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-900 focus:bg-white text-slate-800 text-right"
            />
          </div>
          <button
            onClick={() => onAddNew(dbSubTab)}
            className="px-6 py-2.5 bg-indigo-950 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-black transition-colors"
          >
            <Plus size={16} />
            افزودن مورد جدید
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          {dbSubTab === "schools" && (
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-650 font-black uppercase">
                  <th className="py-4 px-5">شناسه</th>
                  <th className="py-4 px-5">نام مدرسه</th>
                  <th className="py-4 px-5">نوع ارتباط</th>
                  <th className="py-4 px-5">شهر</th>
                  <th className="py-4 px-5">ظرفیت</th>
                  <th className="py-4 px-5 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schoolsDb.filter(s => s.name.toLowerCase().includes(dbSearchTerm.toLowerCase())).map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-50/70 transition font-medium">
                    <td className="py-4 px-5 font-mono text-[10px] text-indigo-850 font-black">{sc.id}</td>
                    <td className="py-4 px-5 font-extrabold text-slate-900">{sc.name}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded-full font-bold border text-[9px] bg-indigo-50 text-indigo-700 border-indigo-150">{sc.type}</span>
                    </td>
                    <td className="py-4 px-5 font-bold">{sc.city}</td>
                    <td className="py-4 px-5 text-slate-500">{toPersianNum(sc.activeCount)} / {toPersianNum(sc.studentCapacity)}</td>
                    <td className="py-4 px-5 text-left flex justify-end gap-2">
                      <button onClick={() => onEditSchool(sc)} className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">ویرایش</button>
                      <button onClick={() => onDeleteSchool(sc.id, sc.name)} className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* Add more tables for counselors, teachers, students... */}
          {dbSubTab === "students" && (
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-slate-650 font-black uppercase">
                  <th className="py-4 px-5">کد</th>
                  <th className="py-4 px-5">نام داوطلب</th>
                  <th className="py-4 px-5">رشته</th>
                  <th className="py-4 px-5">تراز آزمون</th>
                  <th className="py-4 px-5 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {studentsDbList.filter(s => s.name.toLowerCase().includes(dbSearchTerm.toLowerCase())).map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition font-medium">
                    <td className="py-4 px-5 font-mono text-[10px] text-indigo-850 font-black">{st.code}</td>
                    <td className="py-4 px-5 font-extrabold text-slate-900">{st.name}</td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded-full font-bold border text-[9px] bg-amber-50 text-amber-700 border-amber-150">{st.field}</span>
                    </td>
                    <td className="py-4 px-5 font-mono font-black text-indigo-950">{toPersianNum(st.academicProfile?.currentTraz || 0)}</td>
                    <td className="py-4 px-5 text-left flex justify-end gap-2">
                      <button onClick={() => onEditStudent(st)} className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold">ویرایش</button>
                      <button onClick={() => onDeleteStudent(st.id, st.name)} className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold">حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
