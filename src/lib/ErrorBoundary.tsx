import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto my-10 bg-red-50 border border-red-200 text-red-900 rounded-3xl space-y-4 shadow-lg text-right" dir="rtl">
          <h2 className="text-xl font-black">خطایی در سامانه رخ داده است (Oops, something went wrong)</h2>
          <p className="text-sm">ما متوجه یک ناهماهنگی در داده‌های پردازشی یا نمایش شدید؛ با کلیک بر روی دکمه زیر وضعیت را پاکسازی و صفحه را بارگذاری مجدد نمایید.</p>
          {this.state.error && (
            <div className="p-4 bg-red-100 rounded-2xl text-left font-mono text-xs overflow-auto max-h-60" dir="ltr">
              <strong className="text-red-800">{String(this.state.error.message)}</strong>
              <br />
              <pre className="mt-2 text-[10px] opacity-80 whitespace-pre-wrap">{this.state.error.stack}</pre>
            </div>
          )}
          <div className="flex gap-3 justify-start pt-2">
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.href = "/welcome";
              }} 
              className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 hover:bg-red-700 transition cursor-pointer"
            >
              پاکسازی حافظه و بازگشت به خانه
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2.5 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300 transition cursor-pointer"
            >
              بارگذاری مجدد صفحه
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
