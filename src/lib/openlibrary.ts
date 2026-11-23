export type CatalogBook = {
  olKey: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  year: number | null;
};

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
};

export function toCatalogBook(doc: OpenLibraryDoc): CatalogBook | null {
  if (!doc.key || !doc.title) return null;
  return {
    olKey: doc.key,
    title: doc.title.slice(0, 300),
    author: doc.author_name?.slice(0, 2).join(", ").slice(0, 300) || null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    year: doc.first_publish_year ?? null,
  };
}

export async function searchCatalog(query: string, signal?: AbortSignal): Promise<CatalogBook[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=12&fields=key,title,author_name,cover_i,first_publish_year`;
  const res = await fetch(url, signal ? { signal } : undefined);
  if (!res.ok) throw new Error("The book catalog is not responding right now.");
  const json = (await res.json()) as { docs?: OpenLibraryDoc[] };
  return (json.docs ?? []).map(toCatalogBook).filter((b): b is CatalogBook => b !== null);
}
