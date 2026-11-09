import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./styles.module.css";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(value: string) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function formatDateInput(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${date.getFullYear()}`;
}

function formatDateValue(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function DatePicker({
  value,
  onChange,
  required = false,
  disabled = false,
  name,
  placeholder = "mm/dd/yyyy",
}: DatePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedDate = parseDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    getMonthStart(selectedDate ?? new Date()),
  );

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const calendarStart = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1 - visibleMonth.getDay(),
  );
  const calendarDates = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });

  function openCalendar() {
    if (disabled) return;
    setVisibleMonth(getMonthStart(selectedDate ?? new Date()));
    setIsOpen(true);
  }

  function selectDate(date: Date) {
    onChange(formatDateValue(date));
    setVisibleMonth(getMonthStart(date));
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function moveMonth(amount: number) {
    setVisibleMonth(
      (currentMonth) =>
        new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + amount,
          1,
        ),
    );
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);
  const todayValue = formatDateValue(new Date());

  return (
    <div className={styles.datePicker} ref={rootRef}>
      <input
        ref={inputRef}
        className={styles.input}
        type="text"
        value={selectedDate ? formatDateInput(selectedDate) : ""}
        placeholder={placeholder}
        readOnly
        required={required}
        disabled={disabled}
        aria-required={required}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Choose date"
        onClick={openCalendar}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === "ArrowDown") {
            event.preventDefault();
            openCalendar();
          }
        }}
      />
      {name && <input type="hidden" name={name} value={value} />}
      <CalendarDays className={styles.inputIcon} size={17} aria-hidden="true" />

      {isOpen && (
        <div className={styles.calendar} role="dialog" aria-label="Choose date">
          <div className={styles.calendarHeader}>
            <button
              type="button"
              className={styles.monthButton}
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft size={17} />
            </button>
            <strong>{monthLabel}</strong>
            <button
              type="button"
              className={styles.monthButton}
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className={styles.calendarGrid}>
            {weekdays.map((weekday) => (
              <span className={styles.weekday} key={weekday}>
                {weekday}
              </span>
            ))}
            {calendarDates.map((date) => {
              const dateValue = formatDateValue(date);
              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isSelected = dateValue === value;
              const isToday = dateValue === todayValue;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

              return (
                <button
                  type="button"
                  key={dateValue}
                  className={[
                    styles.day,
                    !isCurrentMonth ? styles.outsideMonth : "",
                    isWeekend ? styles.weekend : "",
                    isToday ? styles.today : "",
                    isSelected ? styles.selected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={new Intl.DateTimeFormat("en-US", {
                    dateStyle: "full",
                  }).format(date)}
                  aria-pressed={isSelected}
                  onClick={() => selectDate(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className={styles.calendarFooter}>
            {!required && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                  inputRef.current?.focus();
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className={styles.todayButton}
              onClick={() => selectDate(new Date())}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
