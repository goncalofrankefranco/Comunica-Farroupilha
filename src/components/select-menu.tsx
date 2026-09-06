"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type SelectMenuOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  value: string;
  options: readonly SelectMenuOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
  leading?: ReactNode;
  placeholder?: string;
};

function wrapIndex(index: number, length: number) {
  if (length === 0) return -1;
  return (index + length) % length;
}

export function SelectMenu({ value, options, onChange, ariaLabel, className = "", leading, placeholder = "Selecione uma opção" }: SelectMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function commitOption(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (options.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(wrapIndex((open ? activeIndex : selectedIndex) + 1, options.length));
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(wrapIndex((open ? activeIndex : selectedIndex) - 1, options.length));
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(event.key === "Home" ? 0 : options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) commitOption(activeIndex);
      else {
        setOpen(true);
        setActiveIndex(selectedIndex);
      }
      return;
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`select-menu ${className}`} data-open={open ? "true" : "false"}>
      <button
        ref={triggerRef}
        type="button"
        className="select-menu-trigger tactile-control"
        aria-label={`${ariaLabel}: ${selectedOption?.label ?? placeholder}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => {
          setOpen((current) => {
            if (!current) setActiveIndex(selectedIndex);
            return !current;
          });
        }}
        onKeyDown={handleKeyDown}
      >
        {leading && <span className="select-menu-leading">{leading}</span>}
        <span className="select-menu-value">{selectedOption?.label ?? placeholder}</span>
        <svg className="select-menu-chevron" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div id={listboxId} className="select-menu-popover" role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={`select-menu-option ${index === activeIndex ? "is-active" : ""}`}
              key={option.value}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => commitOption(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="select-menu-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
