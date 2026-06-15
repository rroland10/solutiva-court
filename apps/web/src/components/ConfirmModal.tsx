"use client";

import { Modal } from "./Modal";
import { Icon } from "./icons";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
  variant?: "danger" | "primary";
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onClose,
  loading,
  variant = "primary",
}: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-gray-800 text-base mb-6 leading-relaxed font-medium">{message}</p>
      <div className="flex gap-3 justify-end">
        <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all disabled:opacity-60 ${
            variant === "danger"
              ? "bg-danger text-white hover:bg-red-600 shadow-md"
              : "btn-primary"
          }`}
          onClick={onConfirm}
          disabled={loading}
        >
          {variant === "danger" && <Icon name="warning" size="sm" />}
          {loading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
