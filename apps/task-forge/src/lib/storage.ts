import type { Task } from './types';

const STORAGE_KEY = 'taskforge:v1';

// localStorage may be unavailable (private mode, quota, disabled). Wrap every
// access in try/catch and fall back to an in-memory list so the app still
// works in those edge cases — just without persistence.

let memoryFallback: Task[] | null = null;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(value: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch {
    return false;
  }
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.done === 'boolean' &&
    (t.priority === 'low' || t.priority === 'med' || t.priority === 'high') &&
    typeof t.tag === 'string' &&
    typeof t.createdAt === 'number'
  );
}

export function loadTasks(): Task[] {
  const raw = readRaw();
  if (raw === null) {
    return memoryFallback ?? [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return memoryFallback ?? [];
    const tasks = parsed.filter(isTask);
    memoryFallback = tasks;
    return tasks;
  } catch {
    return memoryFallback ?? [];
  }
}

export function saveTasks(tasks: Task[]): void {
  memoryFallback = tasks;
  writeRaw(JSON.stringify(tasks));
}
