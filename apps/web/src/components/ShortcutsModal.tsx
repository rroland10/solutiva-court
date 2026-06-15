"use client";

import { Modal } from "./Modal";

interface ShortcutsModalProps {
  onClose: () => void;
}

const shortcuts = [
  { keys: "1", action: "Go to Dashboard" },
  { keys: "2", action: "Go to Disputes" },
  { keys: "3", action: "Go to Jury Pool" },
  { keys: "4", action: "Go to Profile" },
  { keys: "v", action: "Vote now (when jury vote is pending)" },
  { keys: "p", action: "Review pending case (when activation is needed)" },
  { keys: "n", action: "New dispute (Dashboard or Disputes page)" },
  { keys: "m", action: "Toggle my cases filter (on Disputes page)" },
  { keys: "f", action: "Clear all filters (on Disputes page)" },
  { keys: "a", action: "Filter active disputes (on Disputes page)" },
  { keys: "s", action: "Filter my pending cases (on Disputes page)" },
  { keys: "/", action: "Focus search (on Disputes page)" },
  { keys: "?", action: "Show keyboard shortcuts" },
  { keys: "t", action: "Toggle light / dark theme" },
  { keys: "Esc", action: "Close modal" },
];

export function ShortcutsModal({ onClose }: ShortcutsModalProps) {
  return (
    <Modal title="Keyboard Shortcuts" onClose={onClose}>
      <p className="text-muted mb-4">
        Press <kbd className="kbd text-xs px-2 py-1">?</kbd> anytime to reopen this guide.
      </p>
      <ul className="shortcuts-list">
        {shortcuts.map((item) => (
          <li key={item.keys} className="shortcuts-row">
            <span className="shortcuts-action">{item.action}</span>
            <kbd className="kbd">{item.keys}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
