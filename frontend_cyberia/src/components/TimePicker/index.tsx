import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3 } from "lucide-react";
import styles from "./styles.module.css";

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function currentTime() {
  const now = new Date();
  return [now.getHours(), now.getMinutes()].map((part) => String(part).padStart(2, "0")).join(":");
}

export function TimePicker({ value, onChange, disabled = false }: TimePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [error, setError] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(260, window.innerWidth - 24);
      const top = rect.bottom + 8 + 184 <= window.innerHeight
        ? rect.bottom + 8
        : Math.max(12, rect.top - 184 - 8);
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      setPosition({ top, left });
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node &&
        !triggerRef.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    updatePosition();
    hourRef.current?.focus();
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  function openPicker() {
    if (disabled) return;
    const [selectedHour, selectedMinute] = (value || currentTime()).split(":");
    setHour(selectedHour);
    setMinute(selectedMinute);
    setError("");
    setPortalTarget(triggerRef.current?.closest("dialog") ?? document.body);
    setIsOpen(true);
  }

  function applyTime() {
    const hours = Number(hour);
    const minutes = Number(minute);
    if (!hour.trim() || !minute.trim() || !Number.isInteger(hours) || !Number.isInteger(minutes) ||
      hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      setError("Enter a valid time between 00:00 and 23:59.");
      return;
    }

    onChange(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        disabled={disabled}
        aria-label={value ? `Time: ${value}. Change time` : "Choose time"}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => isOpen ? setIsOpen(false) : openPicker()}
      >
        <span>{value || "--:--"}</span>
        <Clock3 size={17} aria-hidden="true" />
      </button>

      {isOpen && portalTarget && createPortal(
        <div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-label="Choose time"
          style={position}
        >
          <strong>Choose time</strong>
          <div className={styles.timeFields}>
            <label>
              Hour
              <input
                ref={hourRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                aria-label="Hour, 00 to 23"
                value={hour}
                onChange={(event) => { setHour(event.currentTarget.value.replace(/\D/g, "")); setError(""); }}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyTime(); } }}
              />
            </label>
            <span aria-hidden="true">:</span>
            <label>
              Minute
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                aria-label="Minute, 00 to 59"
                value={minute}
                onChange={(event) => { setMinute(event.currentTarget.value.replace(/\D/g, "")); setError(""); }}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyTime(); } }}
              />
            </label>
          </div>
          {error && <small className={styles.error} role="alert">{error}</small>}
          <div className={styles.actions}>
            <button type="button" onClick={() => { onChange(""); setIsOpen(false); triggerRef.current?.focus(); }}>Clear</button>
            <button type="button" onClick={() => { onChange(currentTime()); setIsOpen(false); triggerRef.current?.focus(); }}>Now</button>
            <button type="button" className={styles.apply} onClick={applyTime}>Apply</button>
          </div>
        </div>,
        portalTarget,
      )}
    </>
  );
}
