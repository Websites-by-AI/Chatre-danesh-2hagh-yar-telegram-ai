import { Student } from "../types";
import { 
  getCounselorProfile, 
  saveCounselorProfile, 
  getTeacherProfile, 
  saveTeacherProfile, 
  getHydratedStudent, 
  saveHydratedStudent,
  CounselorProfile,
  TeacherProfile
} from "./userProfiles";

export interface SchoolProfile {
  id: string;
  name: string;
  type: "smart" | "nokhbegan" | "public" | "sampad"; // نوع مدرسه (هوشمند، فرزانگان، دولتی، سمپاد)
  city: string; // شهر محل شعبه/مدرسه
  address: string; // نشانی فیزیکی
  contactPhone: string; // تلفن تماس شعبه یا مدرسه
  establishedYear: number; // سال تاسیس یا الحاق به شبکه کایزن
  studentCapacity: number; // ظرفیت آکادمیک داوطلبان
  activeCount: number; // تعداد داوطلبان فعال فعلی
}

// Default initial schools database
const DEFAULT_SCHOOLS: SchoolProfile[] = [
  {
    id: "SCH_ID_101",
    name: "دبیرستان هوشمند آتیه تهران (شعبه جردن)",
    type: "smart",
    city: "تهران",
    address: "تهران، خیابان جردن، نرسیده به میرداماد، پلاک ۱۲",
    contactPhone: "۰۲۱-۸۸۷۶۵۴۳۲",
    establishedYear: 1395,
    studentCapacity: 250,
    activeCount: 184
  },
  {
    id: "SCH_ID_102",
    name: "مجموعه فرزانگان ۱ تهران (دخترانه)",
    type: "sampad",
    city: "تهران",
    address: "تهران، خیابان ولیعصر، روبروی بزرگراه نیایش",
    contactPhone: "۰۲۱-۲۲۰۱۸۹۷۶",
    establishedYear: 1370,
    studentCapacity: 500,
    activeCount: 395
  },
  {
    id: "SCH_ID_103",
    name: "آکادمی نخبگان البرز (شعبه جهانشهر)",
    type: "nokhbegan",
    city: "کرج",
    address: "کرج، جهانشهر، خیابان هلال احمر، مجتمع کایزن",
    contactPhone: "۰۲۶-۳۴۴۸۷۹۵۴",
    establishedYear: 1400,
    studentCapacity: 150,
    activeCount: 124
  }
];

// --- Generic Database API ---

/**
 * Centered generic role data query orchestrator.
 * Dynamically loads and returns information for counselors, teachers, students or school profiles.
 */
export async function fetchRoleData(role: string, id: string): Promise<any> {
  // Simulate database network latency to match production standards
  await new Promise((resolve) => setTimeout(resolve, 100));

  const normalizedRole = role.toLowerCase().trim();

  switch (normalizedRole) {
    case "counselor": {
      const counselors = getCounselors();
      const matched = counselors.find(c => c.id === id);
      if (matched) return matched;
      // Fallback/Default active profile
      return getCounselorProfile();
    }
    case "teacher": {
      const teachers = getTeachers();
      const matched = teachers.find(t => t.id === id);
      if (matched) return matched;
      // Fallback/Default active profile
      return getTeacherProfile();
    }
    case "student": {
      const students = getStudentsList();
      const matched = students.find(s => s.id === id || s.code === id);
      if (matched) return getHydratedStudent(matched);
      // Fallback
      return getHydratedStudent({ id });
    }
    case "school": {
      const schools = getSchools();
      return schools.find(s => s.id === id) || schools[0];
    }
    default:
      throw new Error(`Role database table '${role}' is not mapped in unified dataService.`);
  }
}

// --- Specific Resource Management API ---

/**
 * Returns list of schools from storage
 */
export function getSchools(): SchoolProfile[] {
  try {
    const data = localStorage.getItem("taranom_schools_db");
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading schools database:", e);
  }
  // Store defaults initially
  saveSchools(DEFAULT_SCHOOLS);
  return DEFAULT_SCHOOLS;
}

export function saveSchools(schools: SchoolProfile[]): void {
  try {
    localStorage.setItem("taranom_schools_db", JSON.stringify(schools));
  } catch (e) {
    console.error("Error writing schools database:", e);
  }
}

export function addOrUpdateSchool(school: SchoolProfile): void {
  const current = getSchools();
  const index = current.findIndex(s => s.id === school.id);
  if (index >= 0) {
    current[index] = school;
  } else {
    current.push(school);
  }
  saveSchools(current);
}

export function deleteSchool(id: string): void {
  const current = getSchools();
  const filtered = current.filter(s => s.id !== id);
  saveSchools(filtered);
}

/**
 * Returns dynamic list of counselors in the system 
 */
export function getCounselors(): CounselorProfile[] {
  try {
    const data = localStorage.getItem("taranom_counselors_list_db");
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(e);
  }
  
  // Initialize with default
  const defaultList = [
    getCounselorProfile(),
    {
      id: "COUNSELOR_ID_9941",
      name: "استاد مریم رحیمی",
      licenseNumber: "نظام روان‌شناختی: ۱۱-۴۸۳۰۱",
      fieldOfStudy: "دکتری مشاوره خانواده و تحصیلی از دانشگاه خوارزمی",
      experienceYears: 7,
      workplace: "آکادمی مرکزی ترنم همدلی شعبه نیاوران",
      workHours: "روزهای زوج: ۱۳ الی ۲۰ | پنج‌شنبه‌ها: ۱۰ الی ۱۶",
      specialty: "مدیریت بهداشت روانی و استرس جامع ناشی از آزمون تشریحی پایه دوازدهم"
    },
    {
      id: "COUNSELOR_ID_1022",
      name: "دکتر کیوان علوی",
      licenseNumber: "نظام روان‌شناختی: ۱۱-۲۹۱۲۲",
      fieldOfStudy: "دکتری روان‌شناسی تربیتی از دانشگاه علامه طباطبایی",
      experienceYears: 11,
      workplace: "مرکز مشاوره تحصیلی و انگیزشی کایزن شعبه غرب تهران",
      workHours: "کل طول هفته به صورت شیفتی و پایش بلادرنگ",
      specialty: "درمان کمال‌گرایی کاهنده تندخوانی و بهینه‌سازی الگوهای خواب داوطلبان"
    }
  ];
  saveCounselors(defaultList);
  return defaultList;
}

export function saveCounselors(list: CounselorProfile[]): void {
  try {
    localStorage.setItem("taranom_counselors_list_db", JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

export function addOrUpdateCounselor(counselor: CounselorProfile): void {
  const current = getCounselors();
  const idx = current.findIndex(c => c.id === counselor.id);
  if (idx >= 0) {
    current[idx] = counselor;
  } else {
    current.push(counselor);
  }
  saveCounselors(current);
  
  // If editing currently active profile
  if (counselor.id === getCounselorProfile().id || counselor.name === getCounselorProfile().name) {
    saveCounselorProfile(counselor);
  }
}

export function deleteCounselor(id: string): void {
  const current = getCounselors();
  const filtered = current.filter(c => c.id !== id);
  saveCounselors(filtered);
}

/**
 * Returns dynamic list of teachers in the system
 */
export function getTeachers(): TeacherProfile[] {
  try {
    const data = localStorage.getItem("taranom_teachers_list_db");
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(e);
  }
  
  const defaultList = [
    getTeacherProfile(),
    {
      id: "TEACHER_ID_4452",
      name: "مهندس رضا علیزاده",
      specialization: "دبیر برجسته فیزیک تشریحی و سرپرست تیم شبیه‌ساز کنکور تجربی",
      schools: ["دبیرستان فرزانگان ۲ تهران", "دبیرستان البرز"],
      classProgram: "یکشنبه‌ها ساعت ۱۷-۲۰ فیزیک اتمی و کوانتوم دوازدهم، سه‌شنبه‌ها ۱۵-۱۸ حرکت‌شناسی کنکوری",
      licenseNumber: "کد فرهنگیان: ۴۴۵۲۰۹۸۱",
      experienceYears: 10,
      workplace: "دپارتمان فیزیک نوین و کاربری کایزن آرایه",
      workHours: "طول هفته: ۱۴ الی ۲۱ | پنج‌شنبه‌ها: ۸ الی ۱۲",
    },
    {
      id: "TEACHER_ID_5587",
      name: "خانم دکتر سارا مصلایی",
      specialization: "استاد تخصصی عروض قافیه و ادبیات فارسی اختصاصی رشته انسانی",
      schools: ["دبیرستان فرزانگان ۱ تهران", "مدرسه هوشمند آتیه تهران"],
      classProgram: "چهارشنبه‌ها ساعت ۱۶-۱۹ ادبیات اختصاصی پایه دهم تا دوازدهم انسانی",
      licenseNumber: "کد فرهنگیان: ۵۵۸۷۱۲۴۵",
      experienceYears: 15,
      workplace: "دپارتمان ادبیات و عروض فشرده کایزن",
      workHours: "ساعات ویزیت پورتال: شنبه تا چهارشنبه ۱۰ الی ۱۵",
    }
  ];
  saveTeachers(defaultList);
  return defaultList;
}

export function saveTeachers(list: TeacherProfile[]): void {
  try {
    localStorage.setItem("taranom_teachers_list_db", JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

export function addOrUpdateTeacher(teacher: TeacherProfile): void {
  const current = getTeachers();
  const idx = current.findIndex(t => t.id === teacher.id);
  if (idx >= 0) {
    current[idx] = teacher;
  } else {
    current.push(teacher);
  }
  saveTeachers(current);

  // If editing currently active profile
  if (teacher.id === getTeacherProfile().id || teacher.name === getTeacherProfile().name) {
    saveTeacherProfile(teacher);
  }
}

export function deleteTeacher(id: string): void {
  const current = getTeachers();
  const filtered = current.filter(t => t.id !== id);
  saveTeachers(filtered);
}

/**
 * Returns students list. Integrates original bases with newly registered landing leads dynamically.
 */
export function getStudentsList(): Student[] {
  const baseList = [
    { id: "1", name: "مریم حسینی", code: "9812405", field: "tajrobi" as const, grade: "رتبه فرضی ۴۷ کشوری - تراز ۱۰/۴۵۰" },
    { id: "2", name: "علیرضا رضایی", code: "9786431", field: "riazi" as const, grade: "رتبه فرضی ۲۴ کشوری - تراز ۱۰/۱۲۰" },
    { id: "3", name: "امیرمحمد اکبری", code: "9921477", field: "ensani" as const, grade: "رتبه فرضی ۱۲ کشوری - تراز ۹/۹۵۰" }
  ];

  try {
    // Add custom students registered in admin panel
    const custom = localStorage.getItem("taranom_custom_students_db");
    let customList: Student[] = [];
    if (custom) {
      customList = JSON.parse(custom);
    }

    // Also look for dynamic registration landing leads
    const landing = localStorage.getItem("arateb_new_registrations");
    if (landing) {
      const parsed = JSON.parse(landing) as any[];
      parsed.forEach(p => {
        if (!baseList.some(b => b.id === p.id || b.code === p.code) && !customList.some(c => c.id === p.id || c.code === p.code)) {
          customList.push(getHydratedStudent(p));
        }
      });
    }

    // All unified together
    const combined = [...customList, ...baseList.map(b => getHydratedStudent(b))];
    
    // De-duplicate by unique id
    const unique: Student[] = [];
    const seen = new Set<string>();
    combined.forEach(s => {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        unique.push(s);
      }
    });

    return unique;
  } catch (e) {
    console.error("Error reading students combined list:", e);
  }

  return baseList.map(b => getHydratedStudent(b));
}

export function saveStudentsList(list: Student[]): void {
  try {
    // Keep custom students separate from default hardcoded ones, to avoid overwriting default base structures
    const defaults = ["1", "2", "3"];
    const custom = list.filter(student => !defaults.includes(student.id));
    localStorage.setItem("taranom_custom_students_db", JSON.stringify(custom));
    
    // Also save hydrated version for every single one
    list.forEach(student => {
      saveHydratedStudent(student);
    });
  } catch (e) {
    console.error(e);
  }
}

export function addOrUpdateStudent(student: Student): void {
  const current = getStudentsList();
  const idx = current.findIndex(s => s.id === student.id);
  if (idx >= 0) {
    current[idx] = student;
  } else {
    current.push(student);
  }
  saveStudentsList(current);
}

export function deleteStudent(id: string): void {
  const current = getStudentsList();
  const filtered = current.filter(s => s.id !== id);
  saveStudentsList(filtered);
  
  // Remove individual cache
  localStorage.removeItem(`taranom_student_profile_${id}`);
}
