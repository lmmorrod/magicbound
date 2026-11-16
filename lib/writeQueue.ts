/**
 * Writes run one at a time per document, in the order they were made, so a
 * fast run of edits to the same row can't land out of order. Callers update
 * local state first (optimistic) and then queue the write.
 */
export function createWriteQueue(onError: (e: unknown) => void) {
  const chains = new Map<string, Promise<unknown>>();
  return function write(path: string, fn: () => Promise<unknown>): Promise<unknown> {
    const p = (chains.get(path) || Promise.resolve()).then(fn).catch(onError);
    chains.set(path, p);
    p.finally(() => {
      if (chains.get(path) === p) chains.delete(path);
    });
    return p;
  };
}
