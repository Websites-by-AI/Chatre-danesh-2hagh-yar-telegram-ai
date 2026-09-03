export interface StudyPlanDay {
  day: string;
  morning: string;
  afternoon: string;
  qCount: number;
  trapTopic?: string;
  advice?: string;
}

export interface StudyPlan {
  title: string;
  counselorName: string;
  updatedAt: string;
  warnings: string[];
  schedule: StudyPlanDay[];
  extracurricular: string[];
}

export const STUDY_PLAN_EVENT = "taranom-study-plan-updated";

const storageKey = (studentId: string) => `taranom_manual_study_plan_${studentId}`;

export function normalizeStudyPlan(raw: any): StudyPlan | null {
  if (!raw || !Array.isArray(raw.schedule)) return null;
  return {
    title: String(raw.title || "برنامه هفتگی اختصاصی"),
    counselorName: String(raw.counselorName || "مشاور تحصیلی"),
    updatedAt: String(raw.updatedAt || new Date().toISOString()),
    warnings: Array.isArray(raw.warnings) ? raw.warnings.map(String) : [],
    extracurricular: Array.isArray(raw.extracurricular) ? raw.extracurricular.map(String) : [],
    schedule: raw.schedule
      .filter((d: any) => d && d.day)
      .map((d: any) => ({
        day: String(d.day),
        morning: String(d.morning || ""),
        afternoon: String(d.afternoon || ""),
        // Older counselor payloads used totalQ while the student view expected qCount.
        qCount: Math.max(0, Number(d.qCount ?? d.totalQ ?? 0) || 0),
        trapTopic: d.trapTopic ? String(d.trapTopic) : undefined,
        advice: d.advice ? String(d.advice) : undefined,
      })),
  };
}

function readLocal(studentId: string): StudyPlan | null {
  try {
    return normalizeStudyPlan(JSON.parse(localStorage.getItem(storageKey(studentId)) || "null"));
  } catch {
    return null;
  }
}

function writeLocal(studentId: string, plan: StudyPlan) {
  localStorage.setItem(storageKey(studentId), JSON.stringify(plan));
  window.dispatchEvent(new CustomEvent(STUDY_PLAN_EVENT, { detail: { studentId, plan } }));
}

/** Load D1 first when authenticated, while retaining local demo/offline fallback. */
export async function loadStudyPlan(studentId: string): Promise<StudyPlan | null> {
  const local = readLocal(studentId);
  try {
    const response = await fetch(`/api/study-plan?studentId=${encodeURIComponent(studentId)}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (response.status === 404) return local;
    if (!response.ok) return local;
    const data = await response.json();
    const remote = normalizeStudyPlan(data?.plan);
    if (remote) writeLocal(studentId, remote);
    return remote || local;
  } catch {
    return local;
  }
}

/** Save immediately for demo tabs, then persist to D1 for authenticated counselors/admins. */
export async function saveStudyPlan(studentId: string, rawPlan: any): Promise<{ plan: StudyPlan; synced: boolean }> {
  const plan = normalizeStudyPlan(rawPlan);
  if (!plan) throw new Error("ساختار برنامه معتبر نیست.");
  writeLocal(studentId, plan);

  try {
    const response = await fetch("/api/study-plan", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, plan }),
    });
    if (response.ok) return { plan, synced: true };
    if (response.status === 401 || response.status === 403 || response.status === 503) {
      return { plan, synced: false };
    }
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "ذخیره برنامه در سرور ناموفق بود.");
  } catch (error) {
    if (error instanceof TypeError) return { plan, synced: false };
    throw error;
  }
}

export function subscribeToStudyPlan(studentId: string, callback: (plan: StudyPlan | null) => void) {
  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.studentId === studentId) callback(normalizeStudyPlan(detail.plan));
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey(studentId)) callback(readLocal(studentId));
  };
  window.addEventListener(STUDY_PLAN_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(STUDY_PLAN_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
