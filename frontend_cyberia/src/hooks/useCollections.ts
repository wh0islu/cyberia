import { useQueries, useQuery } from "@tanstack/react-query";
import { collectionOptions, type Collection } from "../services/collections";

const empty: never[] = [];

export function useCollection<T>(name: Collection) {
  const query = useQuery(collectionOptions<T>(name));
  return {
    data: query.data ?? empty,
    loading: query.isPending,
    error: query.error?.message ?? "",
  };
}

export function useCollections<T extends { [K in keyof T]: unknown[] }>(names: readonly (keyof T & Collection)[]) {
  const queries = useQueries({ queries: names.map((name) => collectionOptions(name)) });
  const data = Object.fromEntries(names.map((name, index) => [name, queries[index].data ?? empty])) as T;
  const failedSections = names.filter((_, index) => queries[index].isError);
  return { data, failedSections, loading: queries.some((query) => query.isPending) };
}
