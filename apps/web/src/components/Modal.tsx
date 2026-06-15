"use client";

import { useEffect, type ReactNode } from "react";
import { Icon } from "./icons";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "medium" | "large";
}

export function Modal({ title, onClose, children, size = "medium" }: ModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const maxWidth = size === "large" ? "max-w-2xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-indigo-950/60 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-luxury-lg border border-gray-100 dark:border-gray-700 w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <h2 id="modal-title" className="font-display text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-8 h-8 rounded-xl text-gray-800 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <Icon name="close" size="md" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
