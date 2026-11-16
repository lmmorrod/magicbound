"use client";
import { useEffect, useRef } from "react";
import { AREAS, CT, PARK, dayName, parkKey } from "@/lib/plan";
import type { Credit, Item, ParkKey, ResStatus, Table } from "@/lib/types";
import { newId, useStore, type DialogState } from "./store";

// [field, label, type, suggestions (array, or a field name to suggest existing values), help]
type Field = [key: string, label: string, type?: "text" | "number" | "check" | "select", sug?: string[] | string | null, help?: string];
const REC: Partial<Record<Table, [string, Field[]]>> = {
  food: ["food spot", [["name", "Name"], ["type", "Type", "text", ["QS", "TS", "Snack", "Lounge", "Bar"]], ["area", "Where", "text", AREAS], ["spot", "Land or detail"], ["note", "Note (optional)"], ["url", "Menu link (optional)", "text", null, "Paste the https:// link to the official menu page"], ["hi", "High priority", "check"]]],
  qs_wish: ["quick-service spot", [["name", "Name"], ["area", "Where", "text", AREAS], ["key", "Match text (optional)", "text", null, "A word or two from how it's written in the day plan, so it shows as placed. Blank uses the name."]]],
  rides: ["ride", [["name", "Ride"], ["park", "Park", "select", ["MK", "EP", "HS", "AK"]], ["tier", "Tier", "text", "tier"], ["flag", "Warning (optional)", "text", null, "e.g. check it's reopened"]]],
  pack: ["packing item", [["text", "Item"], ["list", "List", "text", "list"], ["group", "Group", "text", "group"]]],
  budget: ["budget line", [["name", "What"], ["cost", "Cost", "number", null, "Leave blank if it's not priced yet"], ["paid", "Paid so far", "number"], ["note", "Note (optional)"]]],
  park_hours: ["park hours row", [["park", "Park"], ["opens", "Opens"], ["closes", "Closes"]]],
};

export function PlannerDialog() {
  const { dialog, openDialog } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (dialog && !d.open) d.showModal();
    if (!dialog && d.open) d.close();
  }, [dialog]);
  return (
    <dialog ref={ref} aria-labelledby="dlgT" onClose={() => openDialog(null)}>
      {dialog && <DialogForm key={JSON.stringify(dialog)} d={dialog} />}
    </dialog>
  );
}

function DialogForm({ d }: { d: NonNullable<DialogState> }) {
  const store = useStore();
  const { data, update, insert, remove, toast, openDialog, canWrite } = store;
  const close = () => openDialog(null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const first = form.current?.querySelector<HTMLInputElement>("input[type=text],input:not([type])");
    setTimeout(() => first?.focus(), 0);
  }, []);
  const val = (id: string) => (form.current?.elements.namedItem(id) as HTMLInputElement | null);

  let title = "", sub = "", body: React.ReactNode = null, canDelete = false;
  let save: () => boolean = () => true;
  let onDelete = () => {};

  if (d.kind === "item") {
    const it = d.item;
    const v: Partial<Item> = it || { day_id: null, time: "", text: "", credit: null, n: 1, res: null, ...d.preset };
    const day = data.days.find((x) => x.id === v.day_id);
    title = it ? "Change this" : "Add to the plan";
    sub = day ? `${dayName(day)} · ${day.label}` : "";
    canDelete = !!it;
    onDelete = () => { if (it) { remove("items", it.id); toast("Removed"); } };
    body = (
      <>
        <label className="fld">What&apos;s happening?<input type="text" name="fx" defaultValue={v.text} placeholder="e.g. Character breakfast" /></label>
        <div className="frow">
          <label className="fld">Day
            <select name="fd" defaultValue={v.day_id ?? "loose"}>
              {data.days.map((x) => <option key={x.id} value={x.id}>{`${dayName(x)} · ${x.label}`}</option>)}
              <option value="loose">Loose · no day yet</option>
            </select>
          </label>
          <label className="fld" style={{ flex: "0 0 120px" }}>Time<input type="time" name="ft" defaultValue={v.time || ""} /></label>
        </div>
        <div className="frow">
          <label className="fld">Dining credit
            <select name="fc" defaultValue={v.credit || ""}>
              <option value="">No credit</option>
              {Object.entries(CT).map(([k, [n]]) => <option key={k} value={k}>{n}</option>)}
            </select>
          </label>
          <label className="fld">Credits used
            <select name="fn" defaultValue={v.n === 2 ? "2" : "1"}><option value="1">1</option><option value="2">2</option></select>
          </label>
        </div>
        <label className="nb" style={{ marginTop: 2 }}><input type="checkbox" name="fr" defaultChecked={!!v.res} /> Needs booking (shows on Reservations)</label>
      </>
    );
    save = () => {
      const credit = (val("fc")!.value || null) as Credit | null;
      const dayId = val("fd")!.value;
      const patch = {
        text: val("fx")!.value.trim(),
        day_id: dayId === "loose" ? null : dayId,
        time: val("ft")!.value,
        credit,
        n: credit === "TS" ? +val("fn")!.value : 1,
        res: (val("fr")!.checked ? it?.res || "todo" : null) as ResStatus | null,
      };
      if (it) update("items", it.id, patch);
      else {
        if (!patch.text) return true;
        insert("items", { id: newId(), used: false, conf: null, ...patch });
        toast("Added");
      }
      return true;
    };
  } else if (d.kind === "day") {
    const day = d.day, k = parkKey(day.park);
    title = dayName(day);
    sub = "The park and title at the top of this column.";
    body = (
      <>
        <label className="fld">Colour
          <select name="fp" defaultValue={k}>{Object.entries(PARK).map(([v, [n]]) => <option key={v} value={v}>{n}</option>)}</select>
        </label>
        <label className="fld">Day title<input type="text" name="fl" defaultValue={day.label} /></label>
        <label className="fld">Special event<input type="text" name="fe" defaultValue={day.event} placeholder="Optional" /></label>
      </>
    );
    save = () => {
      const park = val("fp")!.value as ParkKey;
      let label = val("fl")!.value.trim();
      if (label === day.label && day.label === PARK[k][0] && park !== k) label = PARK[park][0];
      update("days", day.id, { park, label, event: val("fe")!.value.trim() });
      return true;
    };
  } else {
    const spec = REC[d.table];
    if (!spec) return null;
    const [nm, fields] = spec;
    const v = (d.rec || d.preset || {}) as Record<string, unknown>;
    const rows = data[d.table] as unknown as Record<string, unknown>[];
    title = d.rec ? `Change this ${nm}` : `Add a ${nm}`;
    canDelete = !!d.rec;
    onDelete = () => { if (d.rec) { remove(d.table, d.rec.id as string); toast("Removed"); } };
    body = fields.map(([key, label, type = "text", sug, help]) => {
      const id = "rf-" + key, cur = v[key];
      if (type === "check")
        return <label key={key} className="nb" style={{ margin: "4px 0 10px", fontSize: 14 }}><input type="checkbox" name={id} defaultChecked={!!cur && cur !== "false"} /> {label}</label>;
      if (type === "select")
        return (
          <label key={key} className="fld">{label}
            <select name={id} defaultValue={String(cur ?? (sug as string[])[0])}>
              {(sug as string[]).map((o) => <option key={o} value={o}>{o in PARK ? PARK[o as ParkKey][0] : o}</option>)}
            </select>
          </label>
        );
      const opts = Array.isArray(sug) ? sug : typeof sug === "string" ? [...new Set(rows.map((r) => r[sug]).filter(Boolean) as string[])] : [];
      const label2 = type === "number" ? `${label} (${data.trip.currency})` : label;
      return (
        <label key={key} className="fld">{label2}
          <input type={type === "number" ? "number" : "text"} name={id} defaultValue={cur == null ? "" : String(cur)}
            {...(type === "number" ? { step: "any", min: 0, inputMode: "decimal" as const } : {})}
            list={opts.length ? "dl-" + key : undefined} />
          {help && <span className="help">{help}</span>}
          {opts.length > 0 && <datalist id={"dl-" + key}>{opts.map((o) => <option key={o} value={o} />)}</datalist>}
        </label>
      );
    });
    save = () => {
      const out: Record<string, unknown> = {};
      for (const [key, , type = "text"] of fields) {
        const el = val("rf-" + key)!;
        if (type === "check") out[key] = el.checked;
        else if (type === "number") { const n = parseFloat(el.value); out[key] = isNaN(n) ? null : n; }
        else out[key] = el.value.trim();
      }
      if (d.table === "budget" && out.paid === null) out.paid = 0;
      if (!out[fields[0][0]]) { toast("Give it a name first"); return false; }
      if (d.rec) update(d.table, d.rec.id as string, out);
      else {
        out.id = newId();
        out.order = rows.reduce((m, r) => Math.max(m, +(r.order as number) || 0), 0) + 1;
        if (d.table === "pack") out.done = false;
        if (d.table === "food") { out.type ??= ""; out.spot ??= ""; out.note ??= ""; out.url ??= ""; }
        insert(d.table, out as never);
        toast("Added");
      }
      return true;
    };
  }

  return (
    <form ref={form} onSubmit={(e) => { e.preventDefault(); if (!canWrite || save()) close(); }}>
      <h3 id="dlgT">{title}</h3>
      <p className="dsub">{sub}</p>
      <div>{body}</div>
      <div className="dact">
        <button type="button" className="dang" hidden={!canDelete} onClick={() => { onDelete(); close(); }}>Delete</button>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={close}>Cancel</button>
        <button type="submit" className="pri">Save</button>
      </div>
    </form>
  );
}
