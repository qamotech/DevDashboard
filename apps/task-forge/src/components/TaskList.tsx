import type { Task } from '../lib/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<Task, 'title' | 'tag'>>) => void;
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onToggle, onUpdate, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="list__empty">
        Nothing here yet. Add your first task above.
      </div>
    );
  }

  return (
    <ul className="list" aria-label="Tasks">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
