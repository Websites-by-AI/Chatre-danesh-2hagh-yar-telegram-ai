import { TestTrap } from "../types";

export const getTestTraps = (field: string = "bar_scoda", studentId?: string): TestTrap[] => {
  const storageKey = studentId ? `chatre_test_traps_${studentId}` : `chatre_test_traps_${field}`;
  const saved = localStorage.getItem(storageKey) || localStorage.getItem("chatre_test_traps");
  if (!saved) {
    return [
      {
        id: "TRAP-1",
        questionTitle: "خیار شرط بدون ذکر مدت در عقود معاوضی",
        subject: "حقوق مدنی",
        category: "قانون‌محور",
        trapType: "تله عدم ذکر مدت در خیار شرط",
        correctAnswer: "هم شرط خیار و هم خود عقد بیع باطل و بی‌اثر است (ماده ۴۰۱ ق.م)",
        userMistake: "فکر کردم فقط شرط خیار باطل است و عقد به قوت خود باقی است.",
        educationalNote: "اگر برای خیار شرط مدتی معین نشده باشد، هم شرط و هم عقد باطل است چون ثمن یا مبیع مجهول مانده و به غرر منجر می‌شود (ماده ۴۰۱ ق.م).",
        importance: "high",
        createdAt: "۱۴۰۵/۰۲/۲۸"
      },
      {
        id: "TRAP-2",
        questionTitle: "مالکیت ما فی‌الذمه در فرض ارث و سقوط تعهدات",
        subject: "حقوق مدنی",
        category: "مفهومی",
        trapType: "تله سهم‌الارث مدیون",
        correctAnswer: "تعهد مدیون به نسبت سهم‌الارث او از مورث ساقط می‌شود، نه تمام تعهد (ماده ۳۰۰ ق.م)",
        userMistake: "فکر کردم با ارث رسیدن طلب به فرزند مدیون، کل تعهد و بدهی او به کل ساقط می‌شود.",
        educationalNote: "اگر مدیون تنها وارث داین باشد، کل دین ساقط می‌شود؛ ولی اگر وارثان دیگری هم باشند، تعهد او فقط به اندازه سهم‌الارث او ساقط و نسبت به سهم بقیه وارثان طلب به قوت خود باقی است.",
        importance: "high",
        createdAt: "۱۴۰۵/۰۲/۲۹"
      },
      {
        id: "TRAP-3",
        questionTitle: "وضعیت حقوقی منافع مبیع فضولی در بطلان و تنفیذ",
        subject: "حقوق مدنی",
        category: "مفهومی",
        trapType: "تله نظریه کشف حکمی در برابر کشف حقیقی",
        correctAnswer: "در صورت تنفیذ مالک، منافع منفصله از زمان عقد متعلق به مشتری است (ماده ۲۵۸ ق.م - کشف حقیقی)",
        userMistake: "تصور کردم چون اجازه مالک بعداً صادر شده، منافع بین عقد و اجازه مال خود مالک اصلی است (نظریه نقل).",
        educationalNote: "بر اساس ماده ۲۵۸ قانون مدنی، نسبت به منافع حاصله از مال فضولی در فاصله عقد و تنفیذ، اجازه مالک کاشف از مالکیت مشتری از روز عقد است (کشف حقیقی).",
        importance: "medium",
        createdAt: "۱۴۰۵/۰۲/۲۹"
      },
      {
        id: "TRAP-4",
        questionTitle: "مهلت واخواهی برای محکوم‌علیه مقیم خارج از کشور",
        subject: "آیین دادرسی مدنی",
        category: "قانون‌محور",
        trapType: "تله طول مواعد واخواهی قانونی",
        correctAnswer: "مهلت واخواهی برای اشخاص مقیم خارج از کشور ۲ ماه از تاریخ ابلاغ واقعی یا قانونی است (ماده ۳۰۶ ق.آ.د.م)",
        userMistake: "طبق قاعده عادی واخواهی، مهلت را ۲۰ روز محاسبه کردم و گزینه اشتباه را زدم.",
        educationalNote: "مهلت واخواهی، تجدیدنظر و فرجام‌خواهی برای افراد مقیم خارج از کشور دو ماه است؛ در حالی که برای افراد مقیم داخل ۲۰ روز است.",
        importance: "high",
        createdAt: "۱۴۰۵/۰۲/۳۰"
      },
      {
        id: "TRAP-5",
        questionTitle: "صلاحیت دادگاه در دعوای مطالبه خسارت مال غیرمنقول",
        subject: "آیین دادرسی مدنی",
        category: "قانون‌محور",
        trapType: "تله تداخل مال منقول و غیرمنقول",
        correctAnswer: "در دادگاه محل وقوع مال غیرمنقول اقامه می‌شود (ماده ۱۲ ق.آ.د.م در قیاس با ماده ۲۰ قانون مدنی)",
        userMistake: "چون خسارت پول (مال منقول) است، تصور کردم دادگاه عمومی اقامتگاه خوانده صالح است (ماده ۱۱).",
        educationalNote: "دعاوی مربوط به خسارت وارده به مال غیرمنقول از حیث صلاحیت در حکم غیرمنقول بوده و بر اساس ماده ۱۲ ق.آ.د.م منحصراً در صلاحیت دادگاه محل وقوع مال است.",
        importance: "medium",
        createdAt: "۱۴۰۵/۰۲/۳۰"
      },
      {
        id: "TRAP-6",
        questionTitle: "استرداد دادخواست پس از جلسه اول دادرسی",
        subject: "آیین دادرسی مدنی",
        category: "قانون‌محور",
        trapType: "تله تفکیک قرار ابطال عریضه از قرار رد دعوا",
        correctAnswer: "دادگاه قرار رد دعوا صادر می‌کند، نه قرار ابطال دادخواست (ماده ۱۰۷ بند ب ق.آ.د.م)",
        userMistake: "فکر کردم در تمام مراحل استرداد دادخواست، قرار ابطال دادخواست صادر خواهد شد.",
        educationalNote: "استرداد دادخواست تا اولین جلسه دادرسی منجر به قرار ابطال دادخواست (بند الف)؛ پس از آن و تا قبل از ختم دادرسی منجر به قرار رد دعوا (بند ب)؛ و بعد از ختم دادرسی منجر به قرار سقوط دعوا (بند ج) می‌شود.",
        importance: "high",
        createdAt: "۱۴۰۵/۰۲/۳۱"
      }
    ];
  }
  try {
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
};

export const saveTestTrap = (trap: Omit<TestTrap, "id" | "createdAt">, studentId?: string) => {
  const traps = getTestTraps("bar_scoda", studentId);
  const newTrap: TestTrap = {
    ...trap,
    id: `TRAP-${Date.now()}`,
    createdAt: new Date().toLocaleDateString("fa-IR")
  };
  const storageKey = studentId ? `chatre_test_traps_${studentId}` : "chatre_test_traps";
  localStorage.setItem(storageKey, JSON.stringify([newTrap, ...traps]));
  return newTrap;
};

export const deleteTestTrap = (id: string, studentId?: string) => {
  const traps = getTestTraps("bar_scoda", studentId);
  const filtered = traps.filter(t => t.id !== id);
  const storageKey = studentId ? `chatre_test_traps_${studentId}` : "chatre_test_traps";
  localStorage.setItem(storageKey, JSON.stringify(filtered));
};
