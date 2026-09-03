import { SystemLog } from "../types";

export const getSystemLogs = (): SystemLog[] => {
  const saved = localStorage.getItem("taranom_system_logs");
  if (!saved) return [
    { 
      id: "LOG-1003", 
      action: "رفع مشکل چت همزمان هوش مصنوعی", 
      username: "پشتیبان سیستم کایزن", 
      timestamp: "۱۴۰۶/۰۳/۱۱ - ۱۱:۰۵", 
      detail: "اصلاح متد فرستادن پیام (sendMessage) در آداپتور سرور لوکال جهت هماهنگی با کیت جدید توسعه دهنده گوگل تارانوم و افزودن شبیه‌ساز آفلاین لایو در CounselorView." 
    },
    { 
      id: "LOG-1001", 
      action: "ورود به سامانه", 
      username: "admin_taranom", 
      timestamp: "۱۴۰۶/۰۳/۰۹ - ۰۸:۳۰", 
      detail: "ورود موفق مدیریت ارشد به پنل مدیریتی ترنم مهر" 
    },
    { 
      id: "LOG-1002", 
      action: "به‌روزرسانی نقشه راه", 
      username: "admin_taranom", 
      timestamp: "۱۴۰۶/۰۳/۰۹ - ۰۹:۱۵", 
      detail: "تغییر اولویت فازهای آمادگی کنکور تجربی" 
    }
  ];
  try {
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
};

export const addSystemLog = (action: string, username: string, detail: string, isError: boolean = false) => {
  const logs = getSystemLogs();
  const newLog: SystemLog = {
    id: `LOG-${Date.now()}`,
    action: isError ? `[ERROR] ${action}` : action,
    username,
    timestamp: new Date().toLocaleString("fa-IR"),
    detail
  };
  localStorage.setItem("taranom_system_logs", JSON.stringify([newLog, ...logs]));
};
