import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Task {
  id: string;
  type: string;
  getEndpoint: string;
  status: 'pending' | 'completed' | 'failed';
  resultUrl?: string; // e.g. final video/image URL
  createdAt: number;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  apiKey: string;
  setApiKey: (key: string) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'createdAt' | 'status'>) => void;
  updateTaskStatus: (id: string, status: Task['status'], resultUrl?: string) => void;
  clearTasks: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  apiMode: 'direct' | 'proxy';
  setApiMode: (mode: 'direct' | 'proxy') => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: number) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [apiMode, setApiMode] = useState<'direct' | 'proxy'>('direct');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load from LocalStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('magnific_api_key');
    if (storedKey) setApiKey(storedKey);

    const storedTasks = localStorage.getItem('magnific_tasks');
    if (storedTasks) {
      try {
        setTasks(JSON.parse(storedTasks));
      } catch (e) {
        console.error("Failed to parse tasks");
      }
    }

    const storedTheme = localStorage.getItem('magnific_theme');
    if (storedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (storedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const storedApiMode = localStorage.getItem('magnific_api_mode');
    if (storedApiMode === 'proxy') {
      setApiMode('proxy');
    } else {
      setApiMode('direct');
    }
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('magnific_api_key', apiKey);
    } else {
      localStorage.removeItem('magnific_api_key');
    }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('magnific_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('magnific_api_mode', apiMode);
  }, [apiMode]);

  const addTask = (task: Omit<Task, 'createdAt' | 'status'>) => {
    setTasks(prev => [{ ...task, status: 'pending', createdAt: Date.now() }, ...prev]);
  };

  const updateTaskStatus = (id: string, status: Task['status'], resultUrl?: string) => {
    setTasks(prev => 
      prev.map(t => t.id === id ? { ...t, status, resultUrl: resultUrl || t.resultUrl } : t)
    );
  };

  const clearTasks = () => setTasks([]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('magnific_theme', newVal ? 'dark' : 'light');
      if (newVal) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newVal;
    });
  };

  return (
    <AppContext.Provider value={{ apiKey, setApiKey, tasks, addTask, updateTaskStatus, clearTasks, isDarkMode, toggleDarkMode, apiMode, setApiMode, toasts, showToast, removeToast }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
