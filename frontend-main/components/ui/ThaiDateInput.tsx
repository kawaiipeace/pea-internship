"use client";

import { useRef } from "react";

interface ThaiDateInputProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  min?: string;
  className?: string;
  placeholder?: string;
}

/**
 * Formats a YYYY-MM-DD date string to Thai DD/MM/YYYY (Buddhist Era) format.
 */
const formatToThaiDisplay = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0]) + 543; // Convert to Buddhist Era
  const month = parts[1];
  const day = parts[2];
  return `${day}/${month}/${year}`;
};

export default function ThaiDateInput({
  value,
  onChange,
  min,
  className = "",
  placeholder = "วว/ดด/ปปปป",
}: ThaiDateInputProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // Trigger the hidden native date picker
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.focus();
  };

  return (
    <div className="relative w-full" onClick={handleClick}>
      {/* Visible text display showing Thai format */}
      <input
        type="text"
        readOnly
        value={value ? formatToThaiDisplay(value) : ""}
        placeholder={placeholder}
        className={`w-full cursor-pointer ${className}`}
      />
      {/* Hidden native date input for the calendar popup */}
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        tabIndex={-1}
      />
    </div>
  );
}
