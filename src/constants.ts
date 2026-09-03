/**
 * تنظیمات سراسری پلتفرم هوشمند حقوقی چتر دانش (حق‌یار)
 * کلیه نام‌های تجاری، موسسات حقوقی و متن‌های ثابت در این فایل مدیریت می‌شوند.
 */

const getStoredValue = (key: string, defaultValue: string): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key) || defaultValue;
  }
  return defaultValue;
};

export const getInstitutionsList = () => [
  {
    id: "chatre",
    name: getStoredValue("chatre_custom_name_chatre", "چتر دانش"),
    fullName: getStoredValue("chatre_custom_fullname_chatre", "موسسه آموزش عالی آزاد چتر دانش (حق‌یار)"),
    slogan: getStoredValue("chatre_custom_slogan_chatre", "بزرگترین خانواده حقوقی کشور و طراح آزمون‌های وکالت و قضاوت"),
    examProvider: getStoredValue("chatre_custom_examp_chatre", "آزمون‌های مرحله‌ای و جامع کشوری چتر دانش"),
    theme: "indigo"
  },
  {
    id: "dadafarin",
    name: getStoredValue("chatre_custom_name_dadafarin", "دادآفرین"),
    fullName: getStoredValue("chatre_custom_fullname_dadafarin", "موسسه آموزش عالی آزاد دادآفرین"),
    slogan: getStoredValue("chatre_custom_slogan_dadafarin", "مرجع تخصصی رتبه‌های تک‌رقمی وکالت و قضاوت"),
    examProvider: getStoredValue("chatre_custom_examp_dadafarin", "شبیه‌ساز تحلیلی دادآفرین"),
    theme: "amber"
  },
  {
    id: "fakher",
    name: getStoredValue("chatre_custom_name_fakher", "فاخر"),
    fullName: getStoredValue("chatre_custom_fullname_fakher", "موسسه حقوقی فاخر"),
    slogan: getStoredValue("chatre_custom_slogan_fakher", "مهارت‌آموزی حرفه‌ای وکالت و لایحه‌نویسی"),
    examProvider: getStoredValue("chatre_custom_examp_fakher", "سلسله آزمون‌های سرفصلی فاخر"),
    theme: "blue"
  }
];

export const INSTITUTIONS = getInstitutionsList();

export let BRAND_CONFIG = { ...INSTITUTIONS[0] };

export const setBrandById = (id: string) => {
  const currentList = getInstitutionsList();
  const brand = currentList.find(i => i.id === id);
  if (brand) {
    BRAND_CONFIG = { ...brand };
  }
};

export const updateCustomBrandData = (id: string, updates: { name?: string; fullName?: string; slogan?: string; examProvider?: string }) => {
  if (typeof window !== "undefined") {
    if (updates.name) localStorage.setItem(`chatre_custom_name_${id}`, updates.name);
    if (updates.fullName) localStorage.setItem(`chatre_custom_fullname_${id}`, updates.fullName);
    if (updates.slogan) localStorage.setItem(`chatre_custom_slogan_${id}`, updates.slogan);
    if (updates.examProvider) localStorage.setItem(`chatre_custom_examp_${id}`, updates.examProvider);
  }
  setBrandById(id);
};

export const withBrand = (text: string) => {
  return text.replace(/ترنم همدلی/g, BRAND_CONFIG.name);
};
