import React, { useState, useEffect } from "react";
import { Users, UserPlus, RefreshCw, GraduationCap, Home, TrendingUp, Search, Database, Clock, Phone, MapPin } from "lucide-react";
import { Student } from "../../types";

interface StudentManagementProps {
  studentsDbList: Student[];
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  newStudent: Partial<Student>;
  setNewStudent: (val: any) => void;
  onSaveNewStudent: () => void;
  onDeleteStudent: (id: string, name: string) => void;
  onEditStudent: (st: Student) => void;
}

const toPersianNum = (n: number | string): string => {
  if (!n) return "۰";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function StudentManagement({
  studentsDbList, isRegistering, setIsRegistering,
  newStudent, setNewStudent, onSaveNewStudent,
  onDeleteStudent, onEditStudent
}: StudentManagementProps) {
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDbUsers = () => {
    setLoadingDb(true);
    fetch("/api/auth/list")
      .then(res => res.json())
      .then(data => {
        if (data && data.users) {
          setDbUsers(data.users);
        }
      })
      .catch(err => console.warn("Could not fetch database users:", err))
      .finally(() => setLoadingDb(false));
  };

  useEffect(() => {
    fetchDbUsers();
  }, []);

  const filteredUsers = dbUsers.filter(u => 
    (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.mobile || "").includes(searchTerm) ||
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 RTL" style={{ direction: 'rtl' }} id="admin-tab-students">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database size={20} />
            </div>
            <span>مدیریت و مانیتورینگ ثبت‌نام‌های ابری (دیتابیس D1)</span>
          </h3>
          <p className="text-xs text-slate-500 font-bold">لیست زنده تمامی داوطلبانی که از طریق سایت یا ربات ثبت‌نام کرده‌اند به همراه زمان دقیق ثبت‌نام.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchDbUsers}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
            title="بارگذاری مجدد لیست"
          >
            <RefreshCw size={14} className={loadingDb ? "animate-spin" : ""} />
            <span>به‌روزرسانی</span>
          </button>
          
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black transition-all ${
              isRegistering ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-indigo-950 text-white shadow-lg shadow-indigo-900/10"
            }`}
          >
            {isRegistering ? <RefreshCw size={14} /> : <UserPlus size={16} />}
            <span>{isRegistering ? "انصراف" : "ثبت‌نام داوطلب جدید"}</span>
          </button>
        </div>
      </div>

      {/* Manual Registration Form */}
      {isRegistering && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500">نام کامل داوطلب</label>
              <input type="text" value={newStudent.name || ""} onChange={e => setNewStudent({...newStudent, name: e.target.value})} placeholder="مثلاً علی رضایی" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500">شماره موبایل</label>
              <input type="text" value={newStudent.code || ""} onChange={e => setNewStudent({...newStudent, code: e.target.value})} placeholder="09123456789" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500">رشته کنکور</label>
              <select value={newStudent.field || "tajrobi"} onChange={e => setNewStudent({...newStudent, field: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold">
                <option value="tajrobi">تجربی</option>
                <option value="riazi">ریاضی</option>
                <option value="ensani">انسانی</option>
              </select>
            </div>
            <button onClick={onSaveNewStudent} className="md:mt-6 bg-indigo-600 text-white py-2 rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition-all">ثبت نهایی داوطلب</button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute right-4 top-3.5 text-slate-400" />
        <input 
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="جستجو بر اساس نام داوطلب، شماره موبایل یا ایمیل..."
          className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 transition-all shadow-sm"
        />
      </div>

      {/* Database Registered Users Table / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Users size={16} className="text-indigo-600" />
            <span>کاربران واقعی ثبت‌نام‌شده در دیتابیس ابری</span>
            <span className="text-[11px] px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-mono font-black">
              {filteredUsers.length} نفر
            </span>
          </h4>
        </div>

        {loadingDb ? (
          <div className="p-12 text-center text-xs text-slate-400 font-bold bg-white rounded-3xl border border-slate-150 shadow-sm">
            در حال ارتباط با پایگاه داده ابری و استخراج لیست کاربران...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm">
            هیچ کاربری با این مشخصات در دیتابیس یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((u) => (
              <div key={u.id} className="bg-white p-6 rounded-[28px] border border-slate-150 shadow-sm hover:shadow-md transition-all relative overflow-hidden group space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base font-black font-mono shadow-inner">
                      {u.name ? u.name.charAt(0) : "ک"}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{u.name || "کاربر مهمان"}</h4>
                      <p className="text-xs text-indigo-600 font-black font-mono mt-0.5 flex items-center gap-1">
                        <Phone size={12} />
                        {u.mobile || u.email || "بدون شماره"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                    فعال در دیتابیس
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-[11px] font-bold">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="block text-[9px] text-slate-400 mb-0.5 font-black">رشته تحصیلی</span>
                    <span className="text-indigo-950 font-black">
                      {u.field === "tajrobi" ? "تجربی" : u.field === "riazi" ? "ریاضی" : u.field === "ensani" ? "انسانی" : "تجربی"}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="block text-[9px] text-slate-400 mb-0.5 font-black flex items-center gap-1">
                      <MapPin size={10} /> شهر
                    </span>
                    <span className="text-slate-800">{u.city || "ثبت نشده"}</span>
                  </div>
                </div>

                {/* Registration Timestamp */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold pt-1">
                  <Clock size={12} className="text-indigo-500" />
                  <span>زمان ثبت‌نام:</span>
                  <span className="font-mono text-slate-600 font-black" dir="ltr">
                    {u.created_at ? new Date(u.created_at).toLocaleString('fa-IR') : "نامشخص"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
