import { Outlet } from 'react-router-dom';
import { useUiStore } from '@/stores/ui';
import Navigation from './Navigation';

export default function Layout() {
  const { notifications, removeNotification, isSidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <Navigation />

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Notification stack */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              flex items-start gap-3 p-4 rounded-lg shadow-lg max-w-sm text-sm
              ${notification.type === 'success' ? 'bg-success-50 border border-success-200 text-success-800' : ''}
              ${notification.type === 'error' ? 'bg-error-50 border border-error-200 text-error-800' : ''}
              ${notification.type === 'warning' ? 'bg-warning-50 border border-warning-200 text-warning-800' : ''}
              ${notification.type === 'info' ? 'bg-primary-50 border border-primary-200 text-primary-800' : ''}
            `}
            role="alert"
          >
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
