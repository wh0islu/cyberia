import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import styles from "./styles.module.css";

type SelectProps = Omit<ComponentProps<"select">, "children"> & {
  children: ReactNode;
  compact?: boolean;
};

type Option = {
  value: string;
  label: string;
  disabled: boolean;
};

function getOptions(children: ReactNode): Option[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; disabled?: boolean; children?: ReactNode }>(child)) {
      return [];
    }

    if (child.type === "option") {
      const label = String(child.props.children ?? "");
      return [{
        value: child.props.value ?? label,
        label,
        disabled: child.props.disabled ?? false,
      }];
    }

    if (child.type === "optgroup") return getOptions(child.props.children);
    return [];
  });
}

export function Select({
  compact = false,
  className = "",
  children,
  value,
  defaultValue,
  onChange,
  disabled,
  ...props
}: SelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const options = getOptions(children);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    String(defaultValue ?? options[0]?.value ?? ""),
  );
  const selectedValue = String(value ?? uncontrolledValue);
  const selectedOption = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function selectOption(option: Option) {
    if (option.disabled || !selectRef.current) return;

    setUncontrolledValue(option.value);
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLSelectElement.prototype,
      "value",
    )?.set;
    valueSetter?.call(selectRef.current, option.value);
    selectRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    setIsOpen(false);
  }

  function handleButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = Math.max(0, Math.min(options.length - 1, activeIndex + direction));
      setActiveIndex(nextIndex);
      setIsOpen(true);
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (isOpen) selectOption(options[activeIndex]);
      else {
        setActiveIndex(Math.max(0, options.findIndex((option) => option.value === selectedValue)));
        setIsOpen(true);
      }
    }
  }

  const buttonClassName = [
    styles.button,
    compact ? styles.compact : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <span className={styles.wrapper} ref={wrapperRef}>
      <select
        {...props}
        ref={selectRef}
        className={styles.nativeSelect}
        value={selectedValue}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          setUncontrolledValue(event.currentTarget.value);
          onChange?.(event);
        }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {children}
      </select>
      <button
        type="button"
        className={buttonClassName}
        disabled={disabled}
        aria-label={props["aria-label"]}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setActiveIndex(Math.max(0, options.findIndex((option) => option.value === selectedValue)));
          setIsOpen((open) => !open);
        }}
        onKeyDown={handleButtonKeyDown}
      >
        <span>{selectedOption?.label ?? "Select"}</span>
        <ChevronDown className={styles.icon} size={16} aria-hidden="true" />
      </button>
      {isOpen && (
        <span
          className={`${styles.options} ${compact ? styles.compactOptions : ""}`}
          role="listbox"
          aria-label={props["aria-label"]}
        >
          {options.map((option, index) => (
            <button
              key={`${option.value}-${index}`}
              type="button"
              role="option"
              aria-selected={selectedValue === option.value}
              disabled={option.disabled}
              className={styles.option}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span>{option.label}</span>
              {selectedValue === option.value && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
