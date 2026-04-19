import React from 'react';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div
      className={cn("bg-white rounded-2xl border border-gray-100/80 p-6", className)}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {children}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,17,22,0.55)', backdropFilter: 'blur(4px)' }}>
      <div
        className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]"
        style={{ boxShadow: 'var(--shadow-modal)', animation: 'fadeSlideUp 0.22s ease both' }}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-[15px] text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Button({
  children, variant = 'primary', className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
}) {
  const variants = {
    primary: "bg-[#CC0000] text-white hover:bg-[#B50000] active:bg-[#A00000] shadow-sm",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200",
    outline: "border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
        variants[variant], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]",
        "transition-all duration-150",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900",
        "focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]",
        "transition-all duration-150",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-semibold text-gray-600 mb-1.5 tracking-wide uppercase", className)}
      {...props}
    >
      {children}
    </label>
  );
}
