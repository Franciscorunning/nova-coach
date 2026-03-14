import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface Modal {
  id: string;
  component: string;
  props?: Record<string, unknown>;
}

interface UiState {
  notifications: Notification[];
  activeModal: Modal | null;
  isSidebarOpen: boolean;

  // Actions
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  notifications: [],
  activeModal: null,
  isSidebarOpen: false,

  addNotification: (notification) => {
    const id = crypto.randomUUID();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));

    // Auto-remove after duration (default 5s)
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  openModal: (modal) => {
    const id = crypto.randomUUID();
    set({ activeModal: { ...modal, id } });
  },

  closeModal: () => set({ activeModal: null }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));
