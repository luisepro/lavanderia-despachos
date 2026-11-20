"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string, option?: SearchableOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  allowCustom?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "SELECCIONAR...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "SIN RESULTADOS",
  className = "",
  allowCustom = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value || o.label === value),
    [options, value]
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
          isOpen
            ? "bg-white border-[#3B82F6] ring-2 ring-blue-500/15"
            : "border-slate-200/80 hover:bg-white hover:border-slate-300"
        }`}
      >
        <span
          className={`text-[12.5px] font-extrabold uppercase tracking-[-0.01em] truncate ${
            value ? "text-[#1E293B]" : "text-[#94A3B8]"
          }`}
        >
          {selectedOption ? selectedOption.label : value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#94A3B8] shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#3B82F6]" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover matching the exact uploaded screenshot */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-[24px] shadow-[0_14px_40px_rgba(15,23,42,0.14)] border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Top Search Box Header */}
          <div className="p-3 bg-[#F8FAFC] border-b border-slate-100">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[14px] bg-white border-[1.5px] border-[#3B82F6] shadow-sm">
              <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (filteredOptions.length > 0) {
                      onChange(filteredOptions[0].value, filteredOptions[0]);
                      setIsOpen(false);
                    } else if (allowCustom && searchQuery.trim()) {
                      onChange(searchQuery.trim().toUpperCase());
                      setIsOpen(false);
                    }
                  } else if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
                className="w-full bg-transparent text-[13px] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none"
              />
            </div>
          </div>

          {/* Scrollable Options List */}
          <div className="max-h-[220px] overflow-y-auto py-1.5">
            {filteredOptions.length === 0 ? (
              <div className="px-5 py-4 text-center">
                <p className="text-xs font-bold uppercase text-[#94A3B8]">
                  {emptyMessage}
                </p>
                {allowCustom && searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(searchQuery.trim().toUpperCase());
                      setIsOpen(false);
                    }}
                    className="mt-2 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-extrabold uppercase transition-colors cursor-pointer"
                  >
                    + Usar &ldquo;{searchQuery.trim().toUpperCase()}&rdquo;
                  </button>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected =
                  opt.value === value || opt.label === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value, opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/70 text-[#2563EB]"
                        : "text-[#334155] hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <span className="text-[13px] font-extrabold uppercase tracking-[-0.01em] block">
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-[#94A3B8] block mt-0.5">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#2563EB] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CatalogSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  items: { id: string; label: string; sublabel?: string }[];
  placeholder?: string;
}

export function CatalogSearchBox({
  value,
  onChange,
  items,
  placeholder = "Buscar...",
}: CatalogSearchBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.sublabel && i.sublabel.toLowerCase().includes(q))
    );
  }, [items, value]);

  return (
    <div ref={containerRef} className="relative">
      <div className="bg-white p-3.5 rounded-[24px] border border-slate-100 shadow-sm">
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-[16px] bg-white border-[1.5px] transition-all ${
            isOpen
              ? "border-[#3B82F6] ring-2 ring-blue-500/10"
              : "border-[#3B82F6]/80 hover:border-[#3B82F6]"
          }`}
        >
          <Search className="w-4 h-4 text-[#94A3B8] shrink-0" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onFocus={() => setIsOpen(true)}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setIsOpen(false);
            }}
            className="w-full bg-transparent text-[13px] font-medium text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="text-[11px] font-bold uppercase text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {isOpen && filtered.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 z-40 bg-white rounded-[24px] shadow-[0_14px_40px_rgba(15,23,42,0.14)] border border-slate-200/90 overflow-hidden">
          <div className="max-h-[220px] overflow-y-auto py-2">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChange(item.label);
                  setIsOpen(false);
                }}
                className="w-full text-left px-6 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span className="text-[13px] font-extrabold uppercase tracking-[-0.01em] text-[#334155]">
                  {item.label}
                </span>
                {item.sublabel && (
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                    {item.sublabel}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
