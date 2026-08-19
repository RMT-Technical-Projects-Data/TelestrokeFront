import React from "react";
import { LogOut, AlertTriangle, X } from "lucide-react";

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  danger = false,
  icon = "alert",
}) => {
  if (!isOpen) return null;

  const Icon = icon === "logout" ? LogOut : AlertTriangle;

  return (
    <div className="ts-modal-backdrop" onClick={onClose}>
      <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ts-modal-head">
          <h2>{title}</h2>
          <button type="button" className="ts-btn-icon" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="ts-modal-body">
          <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
            <div className="ts-metric-icon">
              <Icon size={18} />
            </div>
            <p className="ts-muted" style={{ margin: 0, lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
          <div className="ts-modal-actions">
            <button type="button" className="ts-btn ts-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={`ts-btn ${danger ? "ts-btn-danger" : "ts-btn-primary"}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
