"use client";

import * as React from "react";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => {
          const base =
            "px-4 py-2 rounded-md shadow-md border text-sm transition-transform animate-slide-in-up bg-background/95 backdrop-blur";
          const variantClass =
            toast.variant === "success"
              ? "border-emerald-400 text-emerald-100"
              : toast.variant === "error"
                ? "border-destructive text-destructive-foreground bg-destructive/90"
                : "border-border text-foreground";
          return (
            <div key={toast.id} className={`${base} ${variantClass}`}>
              {toast.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}


