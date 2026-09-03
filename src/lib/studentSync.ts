/**
 * Student → counselor reverse sync helpers.
 * Task ticks and daily reports are persisted to D1 when authenticated,
 * with a localStorage fallback for the offline/demo mode.
 */

export type TaskProgress = Record<string, Record<string, boolean>>;

export interface DailyReport {
  id: string;
  student_id: string;
  student_name?: string;
  text: string;
  created_at: string;
}

/** Save task completion ticks. Returns whether it synced to the server. */
export async function saveTaskProgress(progress: TaskProgress): Promise<{ synced: boolean }> {
  try {
    const res = await fetch("/api/task-progress", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
    if (res.ok) return { synced: true };
    // 401 (offline/demo) / 403 / 503 → keep local-only, don't throw.
    return { synced: false };
  } catch {
    return { synced: false };
  }
}

/** Load task completion ticks for a student (counselor/admin pass studentId). */
export async function loadTaskProgress(studentId?: string): Promise<TaskProgress | null> {
  try {
    const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    const res = await fetch(`/api/task-progress${q}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.progress || null;
  } catch {
    return null;
  }
}

/** Submit a daily report. Returns whether it synced to the server. */
export async function submitDailyReport(text: string): Promise<{ synced: boolean }> {
  try {
    const res = await fetch("/api/daily-report", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) return { synced: true };
    return { synced: false };
  } catch {
    return { synced: false };
  }
}

/** Load daily reports for a student (counselor/admin pass studentId). */
export async function loadDailyReports(studentId?: string): Promise<DailyReport[]> {
  try {
    const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    const res = await fetch(`/api/daily-report${q}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.reports) ? data.reports : [];
  } catch {
    return [];
  }
}

/** A student as returned by /api/auth/list (real D1 accounts). */
export interface D1Student {
  id: string;
  name: string;
  code?: string;
  field?: string;
  grade?: string;
  city?: string;
  age?: number;
  email?: string;
  mobile?: string;
  accountRole?: string;
}

/** Load real registered students from D1 (counselor/admin only). */
export async function loadD1Students(): Promise<D1Student[]> {
  try {
    const res = await fetch("/api/auth/list", { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.users) ? data.users : [];
  } catch {
    return [];
  }
}
