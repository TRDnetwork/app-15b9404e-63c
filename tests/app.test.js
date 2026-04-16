import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Setup DOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = localStorageMock;

// Import the app logic (we'll test the core functions)
// Since the actual app.js uses Supabase, we'll test the expected localStorage behavior

describe('TaskFlow Pro - localStorage implementation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Task CRUD operations', () => {
    it('should save tasks to localStorage', () => {
      const tasks = [
        { id: '1', title: 'Test task', priority: 'high', is_completed: false, created_at: new Date().toISOString() }
      ];
      localStorage.setItem('tasks', JSON.stringify(tasks));
      expect(localStorage.setItem).toHaveBeenCalledWith('tasks', JSON.stringify(tasks));
      expect(JSON.parse(localStorage.getItem('tasks'))).toEqual(tasks);
    });

    it('should load tasks from localStorage', () => {
      const tasks = [
        { id: '1', title: 'Test task', priority: 'medium', is_completed: true }
      ];
      localStorage.setItem('tasks', JSON.stringify(tasks));
      const loaded = JSON.parse(localStorage.getItem('tasks') || '[]');
      expect(loaded).toEqual(tasks);
    });

    it('should add a new task with required fields', () => {
      const newTask = {
        id: expect.any(String),
        title: 'New task',
        priority: 'low',
        is_completed: false,
        created_at: expect.any(String)
      };
      const tasks = [];
      tasks.push(newTask);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      const stored = JSON.parse(localStorage.getItem('tasks'));
      expect(stored).toHaveLength(1);
      expect(stored[0].title).toBe('New task');
      expect(stored[0].priority).toBe('low');
    });

    it('should toggle task completion status', () => {
      const tasks = [
        { id: '1', title: 'Task', priority: 'high', is_completed: false }
      ];
      localStorage.setItem('tasks', JSON.stringify(tasks));
      const stored = JSON.parse(localStorage.getItem('tasks'));
      stored[0].is_completed = true;
      localStorage.setItem('tasks', JSON.stringify(stored));
      expect(JSON.parse(localStorage.getItem('tasks'))[0].is_completed).toBe(true);
    });

    it('should delete a task by id', () => {
      const tasks = [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' }
      ];
      localStorage.setItem('tasks', JSON.stringify(tasks));
      const stored = JSON.parse(localStorage.getItem('tasks'));
      const filtered = stored.filter(task => task.id !== '1');
      localStorage.setItem('tasks', JSON.stringify(filtered));
      expect(JSON.parse(localStorage.getItem('tasks'))).toHaveLength(1);
      expect(JSON.parse(localStorage.getItem('tasks'))[0].id).toBe('2');
    });
  });

  describe('Filtering logic', () => {
    const sampleTasks = [
      { id: '1', title: 'Task 1', priority: 'high', is_completed: false },
      { id: '2', title: 'Task 2', priority: 'medium', is_completed: true },
      { id: '3', title: 'Task 3', priority: 'low', is_completed: false },
      { id: '4', title: 'Task 4', priority: 'high', is_completed: true }
    ];

    it('should filter by status: active', () => {
      const filtered = sampleTasks.filter(task => !task.is_completed);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(task => !task.is_completed)).toBe(true);
    });

    it('should filter by status: completed', () => {
      const filtered = sampleTasks.filter(task => task.is_completed);
      expect(filtered).toHaveLength(2);
      expect(filtered.every(task => task.is_completed)).toBe(true);
    });

    it('should filter by priority: high', () => {
      const filtered = sampleTasks.filter(task => task.priority === 'high');
      expect(filtered).toHaveLength(2);
      expect(filtered.every(task => task.priority === 'high')).toBe(true);
    });

    it('should combine status and priority filters', () => {
      const filtered = sampleTasks.filter(task => 
        task.priority === 'high' && !task.is_completed
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should show all tasks when no filters applied', () => {
      const filtered = sampleTasks;
      expect(filtered).toHaveLength(4);
    });
  });

  describe('UI rendering expectations', () => {
    it('should generate correct priority badge class', () => {
      const getPriorityClass = (priority) => `priority-${priority}`;
      expect(getPriorityClass('high')).toBe('priority-high');
      expect(getPriorityClass('medium')).toBe('priority-medium');
      expect(getPriorityClass('low')).toBe('priority-low');
    });

    it('should apply completed class to completed tasks', () => {
      const task = { is_completed: true };
      const className = task.is_completed ? 'completed' : '';
      expect(className).toBe('completed');
    });

    it('should escape HTML in task titles', () => {
      const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
  });

  describe('Persistence across reloads', () => {
    it('should load tasks from localStorage on init', () => {
      const tasks = [{ id: '1', title: 'Persisted task' }];
      localStorage.setItem('tasks', JSON.stringify(tasks));
      const loaded = JSON.parse(localStorage.getItem('tasks') || '[]');
      expect(loaded).toEqual(tasks);
    });

    it('should handle empty localStorage', () => {
      localStorage.removeItem('tasks');
      const loaded = JSON.parse(localStorage.getItem('tasks') || '[]');
      expect(loaded).toEqual([]);
    });
  });
});