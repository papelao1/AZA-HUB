import React from 'react';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

export function Card({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 p-6", className)}>
      {children}
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Button({ children, variant = 'primary', className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'outline' }) {
  const variants = {
    primary: "bg-[#CC0000] text-white hover:bg-[#AA0000]",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-100 text-red-600 hover:bg-red-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };
  return (
    <button className={cn("px-4 py-2 rounded-lg font-medium transition-colors", variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={cn("w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000] bg-white", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("block text-sm font-medium text-gray-700 mb-1", className)} {...props}>
      {children}
    </label>
  );
}
