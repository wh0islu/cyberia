import { queryOptions } from "@tanstack/react-query";
import { ApiError, queryClient } from "./queryClient";

export const collections = [
  "books", "movies", "series", "courses", "meals", "meal-notes", "habits", "habit-completions",
] as const;
export type Collection = typeof collections[number];
export const collectionKey = (name: Collection) => ["collection", name] as const;
type Entity = { id: number; [key: string]: unknown };

export function collectionOptions<T>(name: Collection) {
  return queryOptions({
    queryKey: collectionKey(name),


    queryFn: async (): Promise<T[]> => {
      const response = await fetch(`/api/v1/${name}/`, { credentials: "include" });
      if (!response.ok) throw new ApiError(`Could not load ${name} (${response.status}).`, response.status);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error(`Unexpected response for ${name}.`);
      return payload as T[];
    },
  });
}

export function preloadCollections() {
  return Promise.all(collections.map((name) => queryClient.prefetchQuery(collectionOptions(name))));
}

function updateEntity(name: Collection, entity: Entity, deleted: boolean) {
  queryClient.setQueryData<Entity[]>(collectionKey(name), (items) => {

    if (!items) return undefined;
    if (deleted) return items.filter((item) => item.id !== entity.id);
    return items.some((item) => item.id === entity.id)
      ? items.map((item) => item.id === entity.id ? entity : item)
      : [...items, entity];
  });
}


export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(path, options);
  const method = (options.method ?? "GET").toUpperCase();
  const match = /^\/api\/v1\/([^/]+)\/(\d+\/)?$/.exec(path);
  if (!response.ok || !match || ["GET", "HEAD", "OPTIONS"].includes(method)) return response;
  const name = match[1] as Collection;
  if (!collections.includes(name)) return response;

  const deleted = method === "DELETE";
  const payload: unknown = deleted
    ? { id: Number(match[2]?.replace("/", "")) }
    : await response.clone().json().catch(() => null);

  await queryClient.cancelQueries({ queryKey: collectionKey(name) });
  if (payload && typeof payload === "object" && "id" in payload && typeof payload.id === "number") {
    updateEntity(name, payload as Entity, deleted);
  } else {
    void queryClient.invalidateQueries({ queryKey: collectionKey(name) });
  }
  if (!queryClient.getQueryData(collectionKey(name))) {
    void queryClient.invalidateQueries({ queryKey: collectionKey(name) });
  }

  if (name === "habit-completions") {
    await queryClient.cancelQueries({ queryKey: collectionKey("habits") });
    void queryClient.invalidateQueries({ queryKey: collectionKey("habits") });
  }
  if (name === "habits" && deleted) {
    void queryClient.invalidateQueries({ queryKey: collectionKey("habit-completions") });
  }
  return response;
}

export async function deleteCollectionItem(name: Collection, id: number): Promise<void> {
  const csrf = document.cookie.split("; ")
    .find((cookie) => cookie.startsWith("csrftoken="))?.split("=")[1];
  const response = await apiFetch(`/api/v1/${name}/${id}/`, {
    method: "DELETE",
    credentials: "include",
    headers: csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {},
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const detail = payload && typeof payload === "object" && "detail" in payload
      && typeof payload.detail === "string" ? payload.detail : `Could not delete this item (${response.status}).`;
    throw new ApiError(detail, response.status);
  }
}
