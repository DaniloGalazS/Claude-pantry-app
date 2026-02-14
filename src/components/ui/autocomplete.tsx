"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function Autocomplete({
  value,
  onChange,
  suggestions,
  placeholder,
  disabled,
  id,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.length > 0
    ? suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase()) &&
        s.toLowerCase() !== value.toLowerCase()
      )
    : [];

  const showDropdown = open && filtered.length > 0;

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange]
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : filtered.length - 1));
        break;
      case "Enter":
        if (activeIndex >= 0 && filtered[activeIndex]) {
          e.preventDefault();
          select(filtered[activeIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required
        autoComplete="off"
      />
      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {filtered.slice(0, 8).map((item, index) => (
            <li
              key={item}
              className={cn(
                "cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                index === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                select(item);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
