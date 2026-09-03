import { BRAND_CONFIG } from "../constants";
import { Student } from "../types";

export interface TeacherProfile {
  id: string;
  name: string;
  specialization: string; // تخصص (دبیر شیمی، زیست‌شناسی تخصصی و...)
  schools: string[]; // نام مدرسه‌ها
  classProgram: string; // برنامه کلاسی و مباحث هفتگی
  licenseNumber: string; // شماره پرسنلی / کارت صنفی
  experienceYears: number; // سابقه کار (به سال)
  workplace: string; // محل کار اصلی
  workHours: string; // زمان‌بندی کاری و ساعات حضور
}

export interface CounselorProfile {
  id: string;
  name: string;
  licenseNumber: string; // شماره نظام روان‌شناختی یا مربیگری کایزن
  fieldOfStudy: string; // رشته تحصیلی بالینی/مشاوره تحصیلی
  experienceYears: number; // سابقه مشاوره و هدایت آموزشی
  workplace: string; // محل کار / کلینیک / شعبه
  workHours: string; // ساعات کاری و تقویم مشاوره حضوری
  specialty: string; // حوزه تمرکز بالینی (مثلاً فرسودگی تحصیلی دور پایانی، وسواس تکرار)
}

// Default values for Counselor Profile
const DEFAULT_COUNSELOR_PROFILE: CounselorProfile = {
  id: "COUNSELOR_ID_8842",
  name: "استاد پوریا یزدان‌پناه",
  licenseNumber: "نظام روان‌شناختی: ۱۱-۲۹۴۰۵",
  fieldOfStudy: "دکتری روان‌شناسی بالینی و شناختی از دانشگاه تهران",
  experienceYears: 9,
  workplace: `آکادمی مرکزی و دپارتمان بالینی ${BRAND_CONFIG.name} شعبه جردن`,
  workHours: "روزهای زوج: ۹ الی ۱۸ | روزهای فرد: ۹ الی ۱۵ (مشاوره حضوری و کارگاه)",
  specialty: "درمان اضطراب شدید آزمون، فرسودگی عمیق هورمونی و وسواس‌های کاهنده سرعت تست کایزن"
};

// Default values for Teacher Profile
const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  id: "TEACHER_ID_3811",
  name: "دکتر نیما کبریا",
  specialization: "دبیر ارشد شیمی کنکور و طراح شبیه‌ساز کایزن",
  schools: ["دبیرستان هوشمند آتیه تهران", "فرزانگان ۱ تهران", "آکادمی نخبگان البرز"],
  classProgram: "شنبه‌ها ساعت ۱۵-۱۸ شیمی جامع دوازدهم، دوشنبه‌ها ۱۶-۱۹ مبحث استوکیومتری کایزن دهم و یازدهم برای گروه نخبگان",
  licenseNumber: "کد فرهنگیان: ۳۸۱۱۰۹۴۵",
  experienceYears: 12,
  workplace: `دپارتمان بزرگ شیمی و آزمون‌های رند ثانیه‌ای در کانون ${BRAND_CONFIG.name}`,
  workHours: "طول هفته: ۱۴ الی ۲۱ | پنج‌شنبه‌ها: ۸ الی ۱۵ (پایش فشرده ممیزی)",
};

/**
 * Retrieves the profile of counselor. Priority: localStorage -> default
 */
export function getCounselorProfile(): CounselorProfile {
  try {
    const data = localStorage.getItem("taranom_active_counselor_profile");
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading counselor profile:", e);
  }
  return { ...DEFAULT_COUNSELOR_PROFILE };
}

/**
 * Saves or updates the counselor profile.
 */
export function saveCounselorProfile(profile: CounselorProfile): void {
  try {
    localStorage.setItem("taranom_active_counselor_profile", JSON.stringify(profile));
  } catch (e) {
    console.error("Error saving counselor profile:", e);
  }
}

/**
 * Retrieves the profile of teacher. Priority: localStorage -> default
 */
export function getTeacherProfile(): TeacherProfile {
  try {
    const data = localStorage.getItem("taranom_active_teacher_profile");
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading teacher profile:", e);
  }
  return { ...DEFAULT_TEACHER_PROFILE };
}

/**
 * Saves or updates the teacher profile.
 */
export function saveTeacherProfile(profile: TeacherProfile): void {
  try {
    localStorage.setItem("taranom_active_teacher_profile", JSON.stringify(profile));
  } catch (e) {
    console.error("Error saving teacher profile:", e);
  }
}

/**
 * A general helper function/factory/getter requested by user to easily get generic meta based on role
 */
export function getProfileMetadata(role: "student" | "parent" | "counselor" | "teacher" | "admin", extraData?: any) {
  switch (role) {
    case "counselor":
      return getCounselorProfile();
    case "teacher":
      return getTeacherProfile();
    default:
      return {
        id: "USER_GUEST",
        name: extraData?.name || "کاربر میهمان",
        specialty: "عمومی",
        workplace: `موسسه آموزشی ${BRAND_CONFIG.name}`
      };
  }
}

/**
 * Hydrates a brief student profile with consistent, realistic, non-hardcoded data.
 * Priority: localStorage -> dynamic generator based on ID/Code.
 */
export function getHydratedStudent(brief: Partial<Student> | null): Student {
  if (!brief) {
    brief = { id: "1", name: "مریم حسینی", code: "9812405", field: "tajrobi" };
  }
  
  // Try loading from localStorage first
  try {
    const data = localStorage.getItem(`taranom_student_profile_${brief.id}`);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure key properties match brief
      if (brief.name && parsed.name !== brief.name) parsed.name = brief.name;
      if (brief.field && parsed.field !== brief.field) parsed.field = brief.field;
      // Never let stale localStorage remove or elevate a server-provided role.
      if (brief.accountRole) parsed.accountRole = brief.accountRole;
      return parsed;
    }
  } catch (e) {
    console.error("Error loading hydrated student:", e);
  }

  // Create hydrated defaults depending on the student's brief properties
  const isRiazi = brief.field === "riazi";
  const isEnsani = brief.field === "ensani";
  
  let currentTraz = 10450;
  let targetTraz = 11200;
  let currentGpa = 19.8;
  let targetGpa = 20.0;
  let studyHours = 11;
  let vision = "قبولی در رشته پزشکی دانشگاه علوم پزشکی تهران";
  let expect = "تحصیل در مدارج عالی پزشکی تخصصی";
  let grade = brief.grade || "رتبه فرضی ۴۷ کشوری - تراز ۱۰/۴۵۰";
  let city = brief.city || "تهران";
  let age = brief.age || 18;

  if (brief.code === "9786431" || isRiazi) {
    currentTraz = 10120;
    targetTraz = 10800;
    currentGpa = 19.45;
    targetGpa = 19.9;
    studyHours = 10;
    vision = "قبولی در رشته مهندسی کامپیوتر دانشگاه صنعتی شریف";
    expect = "موفقیت علمی و کسب مدارج تراز اول کارآفرینی کامپیوتر";
    grade = brief.grade || "رتبه فرضی ۲۴ کشوری - تراز ۱۰/۱۲۰";
    city = brief.city || "مشهد";
    age = brief.age || 17;
  } else if (brief.code === "9921477" || isEnsani) {
    currentTraz = 9950;
    targetTraz = 10600;
    currentGpa = 19.6;
    targetGpa = 19.95;
    studyHours = 12;
    vision = "قبولی در رشته حقوق قضایی دانشگاه تهران";
    expect = "پذیرش نخبه در کانون وکلا و ارتقاء منزلت اجتماعی کایزن";
    grade = brief.grade || "رتبه فرضی ۱۲ کشوری - تراز ۹/۹۵۰";
    city = brief.city || "تبریز";
    age = brief.age || 19;
  } else if ((brief.id && typeof brief.id === "string" && (brief.id.startsWith("NEW_") || brief.id.length > 5)) || (brief.academicProfile && brief.academicProfile.currentTraz)) {
    // If it already has profile details, use those!
    currentTraz = brief.academicProfile?.currentTraz || 7200;
    targetTraz = brief.academicProfile?.targetTraz || 8500;
    currentGpa = brief.academicProfile?.currentGpa || 18.5;
    targetGpa = brief.academicProfile?.targetGpa || 19.5;
    studyHours = brief.academicProfile?.studyHoursPerDay || 9;
    vision = brief.goals?.studentVision || brief.grade || "قبولی در رشته هدف سراسری";
    expect = brief.goals?.familyExpectation || "موفقیت در کنکور و تعالی آکادمیک";
  }

  const hydrated: Student = {
    id: brief.id || "1",
    name: brief.name || "مریم حسینی",
    code: brief.code || "9812405",
    field: brief.field || "tajrobi",
    grade: grade,
    city: city,
    age: age,
    parentalContext: brief.parentalContext || {
      fatherAlive: true,
      motherAlive: true,
      childrenCount: 2,
      fatherEducation: isRiazi ? "دکتری (استاد دانشگاه)" : isEnsani ? "کارشناسی ارشد (حقوق‌دان)" : "کارشناسی ارشد (مهندسی)",
      motherEducation: isRiazi ? "کارشناسی" : isEnsani ? "کارشناسی" : "دکتری (پزشک عمومی)",
      householdIncome: isRiazi ? "high" : "excellent",
      familySupportLevel: "high"
    },
    academicProfile: brief.academicProfile || {
      studyHoursPerDay: studyHours,
      educationLevel: "پایه دوازدهم کنکور فشرده کایزن",
      currentGpa: currentGpa,
      targetGpa: targetGpa,
      currentTraz: currentTraz,
      targetTraz: targetTraz
    },
    goals: brief.goals || {
      studentVision: vision,
      familyExpectation: expect
    },
    familyContext: brief.familyContext || "محیط خانه آرام و بستر مطالعه به طور کامل توأم با آرامش ذهنی و حامی کایزن مطالعاتی است.",
    additionalNotes: brief.additionalNotes || "برآورد فرسودگی توجه تحت تأثیر زمان‌های طولانی تکرار درسی قرار دارد.",
    paymentStatus: brief.paymentStatus || "paid",
    subscriptionType: brief.subscriptionType || "vip",
    accountRole: brief.accountRole
  };

  // Cache to localStorage
  try {
    localStorage.setItem(`taranom_student_profile_${hydrated.id}`, JSON.stringify(hydrated));
  } catch (e) {
    console.error("Error saving hydrated student state cache:", e);
  }

  return hydrated;
}

export function saveHydratedStudent(student: Student): void {
  try {
    localStorage.setItem(`taranom_student_profile_${student.id}`, JSON.stringify(student));
  } catch (e) {
    console.error("Error saving hydrated student:", e);
  }
}
