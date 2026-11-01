import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryObserver } from "@tanstack/react-query";
import { apiFetch, deleteCollectionItem, collectionKey, collectionOptions, preloadCollections } from "../src/services/collections";
import { ApiError, queryClient } from "../src/services/queryClient";

beforeEach(() => {
  queryClient.clear();
});

afterEach(() => {
  queryClient.clear();
  vi.unstubAllGlobals();
});

describe("shared collection cache", () => {
  it("shares one in-flight request and reuses fresh data on navigation", async () => {
    const fetchMock = vi.fn(async () => Response.json([{ id: 1, title: "A" }]));
    vi.stubGlobal("fetch", fetchMock);
    const [home, books, counter] = await Promise.all([
      queryClient.fetchQuery(collectionOptions("books")),
      queryClient.fetchQuery(collectionOptions("books")),
      queryClient.fetchQuery(collectionOptions("books")),
    ]);
    expect(home).toEqual(books);
    expect(counter).toEqual(books);
    await queryClient.fetchQuery(collectionOptions("books"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps an in-flight request reusable across an observer cleanup/remount", async () => {
    let finish!: (response: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", fetchMock);
    const first = new QueryObserver(queryClient, collectionOptions("books"));
    const unsubscribe = first.subscribe(() => {});
    unsubscribe();
    const second = new QueryObserver(queryClient, collectionOptions("books"));
    const stop = second.subscribe(() => {});
    finish(Response.json([{ id: 1 }]));
    await vi.waitFor(() => expect(second.getCurrentResult().isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    stop();
  });

  it("preloads each collection only once", async () => {
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([preloadCollections(), preloadCollections()]);
    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(new Set(fetchMock.mock.calls.map((call) => call[0])).size).toBe(8);
  });

  it("keeps authorization failures as errors instead of caching an empty collection", async () => {
    const fetchMock = vi.fn(async () => Response.json({ detail: "Unauthorized" }, { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(queryClient.fetchQuery(collectionOptions("habits"))).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(collectionKey("habits"))).toBeUndefined();
  });

  it("rejects a malformed collection response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ invalid: true })));
    await expect(queryClient.fetchQuery({ ...collectionOptions("books"), retry: false }))
      .rejects.toThrow("Unexpected response");
  });
});

describe("mutation synchronization", () => {
  it("updates all observers of a record without another GET and leaves the response readable", async () => {
    queryClient.setQueryData(collectionKey("books"), [{ id: 1, current_page: 2 }]);
    const first = new QueryObserver(queryClient, collectionOptions("books"));
    const second = new QueryObserver(queryClient, collectionOptions("books"));
    const stopFirst = first.subscribe(() => {});
    const stopSecond = second.subscribe(() => {});
    const fetchMock = vi.fn(async () => Response.json({ id: 1, current_page: 30 }));
    vi.stubGlobal("fetch", fetchMock);
    const response = await apiFetch("/api/v1/books/1/", { method: "PATCH" });
    expect(await response.json()).toEqual({ id: 1, current_page: 30 });
    await vi.waitFor(() => {
      expect(first.getCurrentResult().data).toEqual([{ id: 1, current_page: 30 }]);
      expect(second.getCurrentResult().data).toEqual([{ id: 1, current_page: 30 }]);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    stopFirst();
    stopSecond();
  });

  it("adds a created entity once and updates it without duplication", async () => {
    queryClient.setQueryData(collectionKey("courses"), []);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ id: 4, title: "Course" }, { status: 201 })));
    await apiFetch("/api/v1/courses/", { method: "POST" });
    await apiFetch("/api/v1/courses/4/", { method: "PATCH" });
    expect(queryClient.getQueryData(collectionKey("courses"))).toEqual([{ id: 4, title: "Course" }]);
  });

  it("does not change cached data when a write fails", async () => {
    queryClient.setQueryData(collectionKey("meals"), [{ id: 1, category: "LU" }]);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ detail: "Invalid" }, { status: 400 })));
    const response = await apiFetch("/api/v1/meals/1/", { method: "PATCH" });
    expect(response.status).toBe(400);
    expect(queryClient.getQueryData(collectionKey("meals"))).toEqual([{ id: 1, category: "LU" }]);
  });

  it("removes a deleted entity", async () => {
    queryClient.setQueryData(collectionKey("books"), [{ id: 1 }, { id: 2 }]);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await apiFetch("/api/v1/books/1/", { method: "DELETE" });
    expect(queryClient.getQueryData(collectionKey("books"))).toEqual([{ id: 2 }]);
  });

  it("does not invent a full collection from a single created entity", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ id: 1 }, { status: 201 })));
    await apiFetch("/api/v1/meals/", { method: "POST" });
    expect(queryClient.getQueryData(collectionKey("meals"))).toBeUndefined();
  });

  it("updates completions and invalidates the nested habit representation", async () => {
    queryClient.setQueryData(collectionKey("habits"), [{ id: 8, completions: [] }]);
    queryClient.setQueryData(collectionKey("habit-completions"), []);
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ id: 5, habit: 8, completed: true })));
    await apiFetch("/api/v1/habit-completions/", { method: "POST" });
    expect(queryClient.getQueryData(collectionKey("habit-completions")))
      .toEqual([{ id: 5, habit: 8, completed: true }]);
    expect(queryClient.getQueryState(collectionKey("habits"))?.isInvalidated).toBe(true);
  });

  it("prevents a late pre-mutation GET from overwriting a successful write", async () => {
    queryClient.setQueryData(collectionKey("books"), [{ id: 1, title: "Old" }]);
    let finish!: (response: Response) => void;
    vi.stubGlobal("fetch", vi.fn((_path: string, options?: RequestInit) => {
      if (options?.method === "PATCH") return Promise.resolve(Response.json({ id: 1, title: "New" }));
      return new Promise<Response>((resolve) => { finish = resolve; });
    }));
    const staleRead = queryClient.fetchQuery({ ...collectionOptions("books"), staleTime: 0 }).catch(() => undefined);
    await apiFetch("/api/v1/books/1/", { method: "PATCH" });
    finish(Response.json([{ id: 1, title: "Old" }]));
    await staleRead;
    expect(queryClient.getQueryData(collectionKey("books"))).toEqual([{ id: 1, title: "New" }]);
  });
});

describe("deleting collection items", () => {
  it.each(["books", "movies", "series", "courses", "meals", "habits"] as const)(
    "deletes %s with CSRF and removes only that item from cache",
    async (name) => {
      vi.stubGlobal("document", { cookie: "other=value; csrftoken=csrf%2Dtoken" });
      const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetchMock);
      queryClient.setQueryData(collectionKey(name), [{ id: 1 }, { id: 2 }]);
      queryClient.setQueryData(collectionKey("habit-completions"), [{ id: 9, habit: 1 }]);
      await deleteCollectionItem(name, 1);
      expect(fetchMock).toHaveBeenCalledWith(`/api/v1/${name}/1/`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRFToken": "csrf-token" },
      });
      expect(queryClient.getQueryData(collectionKey(name))).toEqual([{ id: 2 }]);
      if (name === "habits") {
        expect(queryClient.getQueryState(collectionKey("habit-completions"))?.isInvalidated).toBe(true);
      }
    },
  );

  it("keeps the item and reports the server error when deletion fails", async () => {
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ detail: "Permission denied." }, { status: 403 })));
    queryClient.setQueryData(collectionKey("books"), [{ id: 1 }]);
    await expect(deleteCollectionItem("books", 1)).rejects.toThrow("Permission denied.");
    expect(queryClient.getQueryData(collectionKey("books"))).toEqual([{ id: 1 }]);
  });

  it("reports a non-JSON server error without removing the item", async () => {
    vi.stubGlobal("document", { cookie: "" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Unavailable", { status: 503 })));
    queryClient.setQueryData(collectionKey("movies"), [{ id: 1 }]);
    await expect(deleteCollectionItem("movies", 1)).rejects.toThrow("Could not delete this item (503).");
    expect(queryClient.getQueryData(collectionKey("movies"))).toEqual([{ id: 1 }]);
  });
});
