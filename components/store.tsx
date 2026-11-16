"use client";
// Trip state, optimistic writes and UI state (edit mode, dialog, toasts).
// Milestone 1 uses a local backend; Supabase slots in behind the same Backend interface.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Day, Item, Table, Trip, TripData } from "@/lib/types";
import { createWriteQueue } from "@/lib/writeQueue";

export interface Backend {
  update(table: Table | "trips", id: string, patch: Record<string, unknown>): Promise<void>;
  insert(table: Table, row: Record<string, unknown>): Promise<void>;
  remove(table: Table, id: string): Promise<void>;
  setLLPick(park: string, ride: string, on: boolean): Promise<void>;
}

/** Does nothing remote. Changes live only in this tab until the Supabase backend lands. */
export const localBackend: Backend = {
  update: async () => {},
  insert: async () => {},
  remove: async () => {},
  setLLPick: async () => {},
};

/** A change pushed from the server (another person's edit, or the echo of ours). */
export interface RemoteChange {
  table: Table | "trips" | "ll_picks";
  type: "INSERT" | "UPDATE" | "DELETE";
  row: Record<string, unknown>; // new row, or the old row for DELETE
}
/** Subscribes to remote changes; returns an unsubscribe function. */
export type Connect = (apply: (c: RemoteChange) => void) => () => void;

export type DialogState =
  | null
  | { kind: "item"; item: Item | null; preset?: Partial<Item> }
  | { kind: "day"; day: Day }
  | { kind: "rec"; table: Table; rec: Record<string, unknown> | null; preset?: Record<string, string> };

type Rows = Record<string, unknown> & { id: string };

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

interface Store {
  data: TripData;
  canWrite: boolean;
  edit: boolean;
  setEdit(v: boolean): void;
  update<T extends Table>(table: T, id: string, patch: Partial<TripData[T][number]>): void;
  updateTrip(patch: Partial<Trip>): void;
  insert<T extends Table>(table: T, row: TripData[T][number]): void;
  remove(table: Table, id: string): void;
  setLLPick(park: string, ride: string, on: boolean): void;
  dialog: DialogState;
  openDialog(d: DialogState): void;
  toast(msg: string): void;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside TripProvider");
  return s;
};

export function TripProvider({
  initial, canWrite = true, backend = localBackend, connect, children,
}: { initial: TripData; canWrite?: boolean; backend?: Backend; connect?: Connect; children: ReactNode }) {
  const [data, setData] = useState(initial);
  const [edit, setEdit] = useState(false);
  const [dialog, openDialog] = useState<DialogState>(null);
  const [toastMsg, setToast] = useState<string | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((m: string) => {
    setToast(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const write = useMemo(() => createWriteQueue(() => toast("Couldn't save that change. Try again.")), [toast]);

  const store = useMemo<Store>(() => {
    const patchRows = (table: Table, fn: (rows: Rows[]) => Rows[]) =>
      setData((d) => ({ ...d, [table]: fn(d[table] as unknown as Rows[]) }));
    return {
      data, canWrite, edit: edit && canWrite, setEdit, dialog, openDialog, toast,
      update(table, id, patch) {
        if (!canWrite) return;
        patchRows(table, (rows) => {
          const next = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
          if (table === "days" && "order" in (patch as object)) next.sort((a, b) => (a.order as number) - (b.order as number));
          return next;
        });
        write(`${table}/${id}`, () => backend.update(table, id, patch as Record<string, unknown>));
      },
      updateTrip(patch) {
        if (!canWrite) return;
        setData((d) => ({ ...d, trip: { ...d.trip, ...patch } }));
        write(`trips/${data.trip.id}`, () => backend.update("trips", data.trip.id, patch));
      },
      insert(table, row) {
        if (!canWrite) return;
        const r = row as unknown as Rows;
        patchRows(table, (rows) => {
          const next = [...rows, r];
          if (table === "days") next.sort((a, b) => (a.order as number) - (b.order as number));
          return next;
        });
        write(`${table}/${r.id}`, () => backend.insert(table, r));
      },
      remove(table, id) {
        if (!canWrite) return;
        patchRows(table, (rows) => rows.filter((r) => r.id !== id));
        write(`${table}/${id}`, () => backend.remove(table, id));
      },
      setLLPick(park, ride, on) {
        if (!canWrite) return;
        setData((d) => ({
          ...d,
          ll_picks: on
            ? [...d.ll_picks.filter((p) => !(p.park === park && p.ride_name === ride)), { park, ride_name: ride }]
            : d.ll_picks.filter((p) => !(p.park === park && p.ride_name === ride)),
        }));
        write(`ll_picks/${park}|${ride}`, () => backend.setLLPick(park, ride, on));
      },
    };
  }, [data, canWrite, edit, dialog, toast, write, backend]);

  useEffect(() => () => clearTimeout(toastT.current), []);

  useEffect(() => {
    if (!connect) return;
    return connect(({ table, type, row }) => {
      setData((d) => {
        if (table === "trips") return type === "UPDATE" ? { ...d, trip: { ...d.trip, ...(row as Partial<Trip>) } } : d;
        if (table === "ll_picks") {
          const same = (p: { park: string; ride_name: string }) => p.park === row.park && p.ride_name === row.ride_name;
          const rest = d.ll_picks.filter((p) => !same(p));
          return { ...d, ll_picks: type === "DELETE" ? rest : [...rest, { park: row.park as string, ride_name: row.ride_name as string }] };
        }
        const rows = d[table] as unknown as Rows[];
        const id = row.id as string;
        if (type === "DELETE") return { ...d, [table]: rows.filter((r) => r.id !== id) };
        const exists = rows.some((r) => r.id === id);
        const next = exists ? rows.map((r) => (r.id === id ? { ...r, ...row } : r)) : [...rows, row as Rows];
        if (table === "days") next.sort((a, b) => (a.order as number) - (b.order as number));
        return { ...d, [table]: next };
      });
    });
  }, [connect]);

  return (
    <Ctx.Provider value={store}>
      {children}
      <div className="toast" role="status" hidden={!toastMsg}>{toastMsg}</div>
    </Ctx.Provider>
  );
}
