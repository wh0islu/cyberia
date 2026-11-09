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
