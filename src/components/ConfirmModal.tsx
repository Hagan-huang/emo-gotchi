import React from "react";
import { createPortal } from "react-dom";
import { soundEffects } from "../utils/audio";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "確定",
  cancelText = "取消",
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 fade-in">
      <div className="bg-[#FFFAEC] border-4 border-[#5D4037] rounded-[2rem] p-8 max-w-sm w-full shadow-[8px_8px_0px_#5D4037] transform transition-all scale-in-center">
        <h3 className="text-2xl font-black text-[#5D4037] mb-2">{title}</h3>
        <p className="text-[#5D4037] font-bold mb-8 mt-4 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-4 w-full">
          <button
            onClick={() => {
              soundEffects.click();
              onCancel();
            }}
            className="px-6 py-3 rounded-2xl font-bold text-[#5D4037] bg-white border-[3px] border-[#C7BBA2] hover:bg-slate-50 transition-colors shadow-[2px_2px_0px_#C7BBA2] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              soundEffects.click();
              onConfirm();
            }}
            className={`px-6 py-3 rounded-2xl font-black border-[3px] transition-all shadow-[2px_2px_0px_#5D4037] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none ${
              isDestructive
                ? "bg-red-400 border-red-600 text-white hover:bg-red-500 shadow-[2px_2px_0px_#b91c1c]"
                : "bg-[#FFD54F] border-[#5D4037] text-[#5D4037] hover:bg-[#FFE082]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
