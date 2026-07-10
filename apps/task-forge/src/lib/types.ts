// Shared types for Task Forge.
// Kept tiny and serializable so the whole task list round-trips through
// localStorage without ceremony.

export type Priority = 'low' | 'med' | 'high';

export interface Task {
  id: string;
  title: string;
  done: boolean;
  priority: Priority;
  tag: string;
  createdAt: number;
}

export type Filter = 'all' | 'active' | 'completed';
export type SortKey = 'created' | 'priority' | 'alpha';
