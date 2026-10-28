import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Camera, Image as ImageIcon, Star, X as XIcon } from "lucide-react";
import { DefaultButton } from "../DefaultButton";
import "./form.css";

export { XIcon };

type FieldProps = {
  label: string;
  required?: boolean;
  optional?: boolean;
  full?: boolean;
  children: ReactNode;
};

type Choice = {
  value: string;
  label: string;
};

type SegmentedProps = {
  label: string;
  options: Choice[];
  value: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
};

type StarsProps = {
  label?: string;
  value: number;
  onChange: (value: number) => void;
};

type SwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

type ImageDropProps = {
  label: string;
  shape?: "cover" | "thumb" | "wide";
  value: File | null;
  imageUrl?: string | null;
  onChange: (file: File | null) => void;
};

export type SourceFormat = {
  value: string;
  label: string;
  location: { label: string; placeholder: string } | null;
  url: { label: string; required?: boolean } | null;
};

export type FormSource = {
  format: string;
  location: string;
  url: string;
};

export type CleanedSource = {
  format: string;
  location: string | null;
  url: string | null;
};

type SourcesFieldProps = {
  title: string;
  formats: SourceFormat[];
  value: FormSource[];
  onChange: (sources: FormSource[]) => void;
  defaultFormat: string;
  locationMax?: number;
};

type FormFooterProps = {
  submitLabel: string;
  onCancel: () => void;
  submitting: boolean;
};

export function Field({
  label,
  required = false,
  optional = false,
  full = false,
  children,
}: FieldProps) {
  return (
    <label className={`field${full ? " field--full" : ""}`}>
      <span className="lbl">
        {label}
        {required && <span className="req"> *</span>}
        {optional && <span className="lbl__opt"> (opcional)</span>}
      </span>
      {children}
    </label>
  );
}

export function Segmented({
  label,
  options,
  value,
  onChange,
  hideLabel = false,
}: SegmentedProps) {
  const labelId = useId();

  return (
    <div className="field field--full">
      {!hideLabel && (
        <span className="lbl" id={labelId}>
          {label}
        </span>
      )}
      <div
        className="segmented"
        role="group"
        aria-labelledby={hideLabel ? undefined : labelId}
        aria-label={hideLabel ? label : undefined}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Stars({ label = "Nota", value, onChange }: StarsProps) {
  const labelId = useId();

  return (
    <div className="field">
      <span className="lbl" id={labelId}>
        {label}
      </span>
      <div className="stars" role="group" aria-labelledby={labelId}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="star"
            aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
            aria-pressed={star <= value}
            onClick={() => onChange(star === value ? 0 : star)}
          >
            <Star
              aria-hidden="true"
              fill={star <= value ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Switch({
  label,
  description,
  checked,
  onChange,
}: SwitchProps) {
  const labelId = useId();

  return (
    <div className="switch-row">
      <div className="switch-row__text">
        <span id={labelId}>{label}</span>
        {description && <span className="lbl lbl__opt">{description}</span>}
      </div>
      <button
        type="button"
        role="switch"
        className="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__knob" />
      </button>
    </div>
  );
}

export function ImageDrop({
  label,
  shape = "cover",
  value,
  imageUrl,
  onChange,
}: ImageDropProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const visiblePreview = preview ?? imageUrl ?? null;

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(value);
    setPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [value]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.currentTarget.files?.[0] ?? null);
  }

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFileChange}
      />
      <button
        type="button"
        className={`drop drop--${shape}${visiblePreview ? " drop--filled" : ""}`}
        aria-label={visiblePreview ? `Replace ${label.toLowerCase()}` : label}
        onClick={() => inputRef.current?.click()}
      >
        {visiblePreview ? (
          <img src={visiblePreview} alt="" />
        ) : (
          <>
            {shape === "wide" ? (
              <Camera aria-hidden="true" />
            ) : (
              <ImageIcon aria-hidden="true" />
            )}
            {label}
          </>
        )}
      </button>
    </>
  );
}

type ChipGroupProps = {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
};

export function ChipGroup({
  label,
  options,
  value,
  onChange,
}: ChipGroupProps) {
  const labelId = useId();

  function alternarOpcao(option: string) {
    const nextValue = value.includes(option)
      ? value.filter((selectedOption) => selectedOption !== option)
      : [...value, option];

    onChange(nextValue);
  }

  return (
    <div className="field field--full">
      <span className="lbl" id={labelId}>
        {label}
      </span>
      <div className="chips" role="group" aria-labelledby={labelId}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="chip"
            aria-pressed={value.includes(option)}
            onClick={() => alternarOpcao(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SourcesField({
  title,
  formats,
  value,
  onChange,
  defaultFormat,
  locationMax = 255,
}: SourcesFieldProps) {
  const formatsByValue = Object.fromEntries(
    formats.map((format) => [format.value, format]),
  );

  function atualizarFonte(index: number, changes: Partial<FormSource>) {
    onChange(
      value.map((source, sourceIndex) =>
        sourceIndex === index ? { ...source, ...changes } : source,
      ),
    );
  }

  function removerFonte(index: number) {
    onChange(value.filter((_, sourceIndex) => sourceIndex !== index));
  }

  function adicionarFonte() {
    onChange([
      ...value,
      { format: defaultFormat, location: "", url: "" },
    ]);
  }

  return (
    <div className="field field--full">
      <div className="field__head">
        <span className="lbl">{title}</span>
        <span className="lbl lbl__opt">
          {value.length === 1 ? "1 source" : `${value.length} sources`}
        </span>
      </div>

      {value.map((source, index) => {
        const format = formatsByValue[source.format];
        if (!format) return null;

        return (
          <div className="source" key={`${source.format}-${index}`}>
            <div className="source__head">
              <Segmented
                hideLabel
                label={`Source format ${index + 1}`}
                options={formats}
                value={source.format}
                onChange={(nextFormat) =>
                  atualizarFonte(index, { format: nextFormat })
                }
              />
              {value.length > 1 && (
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remove source ${index + 1}`}
                  onClick={() => removerFonte(index)}
                >
                  <XIcon />
                </button>
              )}
            </div>
            <div className="row">
              {format.location && (
                <Field label={format.location.label}>
                  <input
                    className="in"
                    type="text"
                    maxLength={locationMax}
                    placeholder={format.location.placeholder}
                    value={source.location}
                    onChange={(event) =>
                      atualizarFonte(index, {
                        location: event.currentTarget.value,
                      })
                    }
                  />
                </Field>
              )}
              {format.url && (
                <Field
                  label={format.url.label}
                  required={format.url.required}
                  optional={!format.url.required}
                >
                  <input
                    className="in"
                    type="url"
                    placeholder="https://"
                    required={format.url.required}
                    value={source.url}
                    onChange={(event) =>
                      atualizarFonte(index, { url: event.currentTarget.value })
                    }
                  />
                </Field>
              )}
            </div>
          </div>
        );
      })}

      <button type="button" className="add-btn" onClick={adicionarFonte}>
        + Add another source
      </button>
    </div>
  );
}

export function cleanSources(
  sources: FormSource[],
  formats: SourceFormat[],
): CleanedSource[] {
  const formatsByValue = Object.fromEntries(
    formats.map((format) => [format.value, format]),
  );

  return sources.map((source) => {
    const format = formatsByValue[source.format];
    if (!format) return source;

    return {
      format: source.format,
      location: format.location ? source.location.trim() || null : null,
      url: format.url ? source.url.trim() || null : null,
    };
  });
}

export function FormFooter({
  submitLabel,
  onCancel,
  submitting,
}: FormFooterProps) {
  return (
    <footer className="form__foot">
      <span className="lbl">
        <span className="req">*</span> required
      </span>
      <div className="form__actions">
        <DefaultButton variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </DefaultButton>
        <DefaultButton type="submit" size="sm" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </DefaultButton>
      </div>
    </footer>
  );
}
