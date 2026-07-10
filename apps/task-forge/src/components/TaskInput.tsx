import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import type { Priority } from '../lib/types';

interface TaskInputProps {
  onAdd: (title: string, priority: Priority, tag: string) => void;
}

export function TaskInput({ onAdd }: TaskInputProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('med');
  const [tag, setTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus on mount so the user can start typing immediately.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;
    onAdd(trimmed, priority, tag.trim());
    setTitle('');
    setTag('');
    setPriority('med');
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setTitle('');
      setTag('');
    }
  };

  return (
    <form className="input" onSubmit={submit}>
      <input
        ref={inputRef}
        className="input__field"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="What needs doing?"
        aria-label="New task title"
        maxLength={200}
      />
      <input
        className="input__field input__field--tag"
        type="text"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="tag (optional)"
        aria-label="Tag"
        maxLength={24}
        style={{ flex: '0 1 140px' }}
      />
      <select
        className="input__select"
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        aria-label="Priority"
      >
        <option value="low">Low</option>
        <option value="med">Medium</option>
        <option value="high">High</option>
      </select>
      <button type="submit" className="input__add" disabled={!canSubmit}>
        Add
      </button>
    </form>
  );
}
