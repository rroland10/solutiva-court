"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { theme } from "@/lib/theme";
import { Icon, type IconName } from "./icons";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastIcons: Record<ToastType, IconName> = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
};

const toastColors: Record<ToastType, string> = {
  success: theme.badge.success,
  error: theme.badge.danger,
  warning: theme.badge.warning,
  info: theme.badge.info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-20 md:bottom-4 right-4 z-[1080] flex flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-panel" role="status">
            <span
              className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${toastColors[toast.type]}`}
            >
              <Icon name={toastIcons[toast.type]} size="sm" />
            </span>
            <span className="toast-message">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
