"use client";
import type { Table } from "@/lib/types";
import { useStore } from "./store";

/** ✎ button that opens the generic record editor. Only shows in edit mode. */
export function EditBtn({ table, rec }: { table: Table; rec: { id: string } }) {
  const { edit, openDialog } = useStore();
  if (!edit) return null;
  return (
    <button type="button" className="eb" aria-label="Edit"
      onClick={() => openDialog({ kind: "rec", table, rec: rec as unknown as Record<string, unknown> })}>✎</button>
  );
}

/** "+ Add …" button for the generic record editor. Only shows in edit mode. */
export function AddBtn({ table, label, preset }: { table: Table; label: string; preset?: Record<string, string> }) {
  const { edit, openDialog } = useStore();
  if (!edit) return null;
  return (
    <button type="button" className="add addin" onClick={() => openDialog({ kind: "rec", table, rec: null, preset })}>
      + {label}
    </button>
  );
}
