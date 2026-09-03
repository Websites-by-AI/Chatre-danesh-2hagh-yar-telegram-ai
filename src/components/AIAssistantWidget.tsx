import React from "react";
import { Brain } from "lucide-react";
import { CollapsibleWidget } from "./CollapsibleWidget";

interface Props {
  isHoverEnabled: boolean;
  hoveredSection: string | null;
  setHoveredSection: (id: string | null) => void;
  lockedSections: string[];
  toggleLockSection: (id: string) => void;
}

export function AIAssistantWidget({
  isHoverEnabled,
  hoveredSection,
  setHoveredSection,
  lockedSections,
  toggleLockSection,
}: Props) {
  return (
    <CollapsibleWidget
      id="ai-assistant-module"
      title="ماژول دستیار هوشمند"
      subtitle="سامانه یابنده گرنت و تدوین پروپوزال - تحلیل و ارتقای ماژول با هوش مصنوعی"
      icon={<Brain size={18} />}
      colorClasses={{ bg: "bg-purple-50", text: "text-purple-600", border: "border-slate-100", accent: "purple", animateGlow: "from-purple-400/20" }}
      isHoverEnabled={isHoverEnabled}
      hoveredSection={hoveredSection}
      setHoveredSection={setHoveredSection}
      lockedSections={lockedSections}
      toggleLockSection={toggleLockSection}
    >
      <div className="space-y-4 text-right">
        <p className="text-xs text-slate-600 leading-relaxed">
          این ماژول را برای ارزیابی عمیق، غنی‌سازی کدها و کپی کردن سناریوهای بهبود فوری به هوش مصنوعی بسپارید.
        </p>
        
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-bold">
            تحلیل و بهبود با هوش مصنوعی
          </button>
          <button className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
            گزارش ارزیابی و بهبود
          </button>
        </div>
        
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-900">پرامپت ارتقاء</h4>
            <p className="text-[10px] text-slate-500 leading-relaxed">
                پرامپت مهندسی شده زیر را کپی کنید و به دستیارهای پیشرو هوش مصنوعی بدهید تا ساختار ماژول را برایتان از صفر تا صد بازنویسی یا ارتقا دهند.
            </p>
            <button className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold">
                کپی پرامپت ارتقاء
            </button>
        </div>

        <button className="w-full px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold">
            کپی کل گزارش
        </button>
      </div>
    </CollapsibleWidget>
  );
}
