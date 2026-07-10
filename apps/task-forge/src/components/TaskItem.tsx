import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import type { Task } from '../lib/types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<Task, 'title' | 'tag'>>) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_LABEL: Record<Task['priority'], string> = {
  low: 'Low',
  med: 'Med',
  high: 'High',
};

export function TaskItem({ task, onToggle, onUpdate, onDelete }: TaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== task.title) {
      onUpdate(task.id, { title: next });
    } else {
      setDraft(task.title);
    }
    setEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      setDraft(task.title);
      setEditing(false);
    }
  };

  return (
    <li className={`item${task.done ? ' item--done' : ''}`}>
      <input
        type="checkbox"
        className="item__check"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        aria-label={task.done ? 'Mark active' : 'Mark complete'}
      />
      <div className="item__main">
        {editing ? (
          <input
            ref={inputRef}
            className="item__edit-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={commit}
            maxLength={200}
            aria-label="Edit task title"
          />
        ) : (
          <>
            <div className="item__title-row">
              <span className="item__title">{task.title}</span>
              <span className={`badge badge--priority-${task.priority}`}>
                {PRIORITY_LABEL[task.priority]}
              </span>
              {task.tag && <span className="badge badge--tag">#{task.tag}</span>}
            </div>
          </>
        )}
      </div>
      <div className="item__actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => setEditing((v) => !v)}
          aria-label={editing ? 'Cancel edit' : 'Edit task'}
          title={editing ? 'Cancel' : 'Edit'}
        >
          {editing ? '✕' : '✎'}
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--danger"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          title="Delete"
        >
          🗑
        </button>
      </div>
    </li>
  );
}
