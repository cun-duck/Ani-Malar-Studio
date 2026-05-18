import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Task {
  id: string;
  type: string;
  getEndpoint: string;
  status: 'pending' | 'completed' | 'failed';
  resultUrl?: string; // e.g. final video/image URL
  batchResults?: any[]; // For models that return multiple results (like Suno)
  error?: string; // error message if failed
  createdAt: number;
  provider?: 'magnific' | 'kie';
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  kieApiKey: string;
  setKieApiKey: (key: string) => void;
  credits: number | null;
  setCredits: (val: number | null) => void;
  tasks: Task[];
  addTask: (task: Omit<Task, 'createdAt' | 'status'>) => void;
  updateTaskStatus: (id: string, status: Task['status'], resultUrl?: string, error?: string, batchResults?: any[]) => void;
  clearTasks: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: number) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [kieApiKey, setKieApiKey] = useState<string>('');
  const [credits, setCredits] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
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
    const storedKieKey = localStorage.getItem('kie_api_key');
    if (storedKieKey) setKieApiKey(storedKieKey);

    const storedTasks = localStorage.getItem('ani_malar_tasks');
    if (storedTasks) {
      try {
        setTasks(JSON.parse(storedTasks));
      } catch (e) {
        console.error("Failed to parse tasks");
      }
    }

    const storedTheme = localStorage.getItem('ani_malar_theme');
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
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    if (kieApiKey) {
      localStorage.setItem('kie_api_key', kieApiKey);
    } else {
      localStorage.removeItem('kie_api_key');
    }
  }, [kieApiKey]);

  useEffect(() => {
    localStorage.setItem('ani_malar_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: Omit<Task, 'createdAt' | 'status'>) => {
    setTasks(prev => [{ ...task, status: 'pending', createdAt: Date.now() }, ...prev]);
  };

  const updateTaskStatus = (id: string, status: Task['status'], resultUrl?: string, error?: string, batchResults?: any[]) => {
    setTasks(prev => 
      prev.map(t => t.id === id ? { 
        ...t, 
        status, 
        resultUrl: resultUrl || t.resultUrl, 
        error: error || t.error,
        batchResults: batchResults || t.batchResults 
      } : t)
    );
  };

  const clearTasks = () => setTasks([]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('ani_malar_theme', newVal ? 'dark' : 'light');
      if (newVal) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newVal;
    });
  };

  return (
    <AppContext.Provider value={{ kieApiKey, setKieApiKey, credits, setCredits, tasks, addTask, updateTaskStatus, clearTasks, isDarkMode, toggleDarkMode, toasts, showToast, removeToast }}>
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
