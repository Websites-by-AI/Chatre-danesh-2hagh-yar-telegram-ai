import { useState, useEffect } from "react";
import { Shield, RefreshCw, UserCheck, GraduationCap, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

/* ============================================================
 * مدیریت نقش‌ها — فقط ادمین
 * RoleManagement: promote/demote users (student/counselor/teacher/admin).
 * Reads /api/auth/list-all (admin only) and writes via /api/auth/update-role.
 * ============================================================ */

interface UserRow {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: string;
  field?: string;
}

const ROLE_META: Record<string, { label: string; color: string; icon: any }> = {
  student:   { label: "دانش‌آموز", color: "bg-sky-50 text-sky-700 border-sky-200", icon: GraduationCap },
  counselor: { label: "مشاور",   color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: UserCheck },
  teacher:   { label: "معلم",    color: "bg-amber-50 text-amber-700 border-amber-200", icon: GraduationCap },
  admin:     { label: "ادمین",   color: "bg-rose-50 text-rose-700 border-rose-200", icon: Shield },
};

export default function RoleManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [notAdmin, setNotAdmin] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/list-all", { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setNotAdmin(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      setMsg({ ok: false, text: "خطا در دریافت لیست کاربران." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeRole = async (userId: string, role: string) => {
    setMsg(null);
    try {
      const res = await fetch("/api/auth/update-role", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg({ ok: true, text: `نقش با موفقیت به «${ROLE_META[role]?.label}» تغییر کرد.` });
        fetchUsers();
      } else {
        setMsg({ ok: false, text: data?.error || "تغییر نقش ناموفق بود." });
      }
    } catch {
      setMsg({ ok: false, text: "خطای شبکه در تغییر نقش." });
    }
  };

  const filtered = users.filter(u =>
    (u.name || "").includes(search) || (u.email || "").includes(search) || (u.mobile || "").includes(search)
  );

  if (notAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <AlertTriangle size={24} className="text-amber-600 mx-auto mb-2" />
        <p className="text-xs font-black text-amber-800">این بخش فقط برای مدیر سیستم (admin) قابل دسترسی است.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Shield size={16} className="text-indigo-600" /> مدیریت نقش کاربران
          </h3>
          <p className="text-[11px] text-slate-500 font-bold mt-0.5">
            ارتقا یا تنزل نقش کاربران (دانش‌آموز، مشاور، معلم، ادمین)
          </p>
        </div>
        <button onClick={fetchUsers} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-black rounded-xl transition cursor-pointer">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> بروزرسانی
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="جستجوی نام / ایمیل / موبایل..."
          className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2.5 text-xs font-bold focus:outline-none focus:border-indigo-400"
        />
      </div>

      {msg && (
        <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
          {msg.ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-right text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-slate-500 text-[10px]">
                <th className="px-3 py-2.5 font-black">کاربر</th>
                <th className="px-3 py-2.5 font-black">شناسه (ایمیل/موبایل)</th>
                <th className="px-3 py-2.5 font-black">نقش فعلی</th>
                <th className="px-3 py-2.5 font-black">تغییر نقش</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-3 py-2.5">
                    <span className="font-black text-slate-800 block">{u.name || "بدون نام"}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]" dir="ltr">
                    {u.email || u.mobile || u.id?.slice(0, 10)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${ROLE_META[u.role]?.color || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {ROLE_META[u.role]?.label || u.role}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      {["student", "counselor", "teacher", "admin"].map(r => (
                        <button
                          key={r}
                          onClick={() => changeRole(u.id, r)}
                          disabled={u.role === r}
                          className={`px-2.5 py-2 rounded-lg text-[10px] font-black border transition cursor-pointer min-h-[40px] disabled:opacity-30 disabled:cursor-default ${u.role === r ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}`}
                        >
                          {ROLE_META[r].label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-slate-400 text-xs">کاربری یافت نشد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
