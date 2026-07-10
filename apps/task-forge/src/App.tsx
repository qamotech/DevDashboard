import { useEffect, useMemo, useState } from 'react';
import type { Filter, Priority, SortKey, Task } from './lib/types';
import { loadTasks, saveTasks } from './lib/storage';
import { TaskInput } from './components/TaskInput';
import { Filters } from './components/Filters';
import { TaskList } from './components/TaskList';

// Generate ids without pulling in a uuid dependency. crypto.randomUUID exists
// in all modern browsers; fall back to a timestamp+random string otherwise.
function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, med: 1, low: 2 };

function sortTasks(tasks: Task[], sort: SortKey): Task[] {
  // Always return a new array; never mutate the input.
  const copy = [...tasks];
  switch (sort) {
    case 'created':
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case 'priority':
      return copy.sort(
        (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
      );
    case 'alpha':
      return copy.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
      );
  }
}

function filterTasks(tasks: Task[], filter: Filter): Task[] {
  if (filter === 'active') return tasks.filter((t) => !t.done);
  if (filter === 'completed') return tasks.filter((t) => t.done);
  return tasks;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('created');

  // Persist on every change. localStorage writes are synchronous and cheap
  // for a list of this size, so no debounce is needed.
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const visible = useMemo(
    () => sortTasks(filterTasks(tasks, filter), sort),
    [tasks, filter, sort],
  );

  const remaining = tasks.filter((t) => !t.done).length;
  const completed = tasks.length - remaining;

  const addTask = (title: string, priority: Priority, tag: string) => {
    setTasks((prev) => [
      ...prev,
      { id: newId(), title, done: false, priority, tag, createdAt: Date.now() },
    ]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  const updateTask = (id: string, patch: Partial<Pick<Task, 'title' | 'tag'>>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => !t.done));
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Task Forge</h1>
        <span className="app__count">
          {remaining} open · {completed} done
        </span>
      </header>

      <TaskInput onAdd={addTask} />

      <Filters
        filter={filter}
        sort={sort}
        onFilterChange={setFilter}
        onSortChange={setSort}
      />

      <TaskList
        tasks={visible}
        onToggle={toggleTask}
        onUpdate={updateTask}
        onDelete={deleteTask}
      />

      <footer className="summary">
        <span>
          {tasks.length === 0
            ? 'Empty list — local only.'
            : `Stored locally in your browser.`}
        </span>
        <button
          type="button"
          className="summary__clear"
          onClick={clearCompleted}
          disabled={completed === 0}
        >
          Clear completed ({completed})
        </button>
      </footer>
    </div>
  );
}
