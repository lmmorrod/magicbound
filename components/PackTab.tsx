"use client";
import { useStore } from "./store";
import { AddBtn, EditBtn } from "./RecButtons";

const DEFAULT_LISTS = ["To do", "Shared essentials"];

export function PackTab() {
  const { data, canWrite, edit, update } = useStore();
  const { pack } = data;
  const lists = [...DEFAULT_LISTS, ...[...new Set(pack.map((p) => p.list))].filter((l) => l && !DEFAULT_LISTS.includes(l))];
  return (
    <section id="pack">
      <h2>Packing</h2>
      <p className="sub">What to sort before you go and what to pack. Ticks are shared, so you can split the list. Tap <b>Edit</b> to add lists, groups or items.</p>
      <div className="grid3">
        {lists.map((l) => {
          const its = pack.filter((p) => p.list === l);
          if (!its.length) return null;
          const groups = [...new Set(its.map((p) => p.group || ""))];
          const done = its.filter((p) => p.done).length;
          return (
            <div key={l} className="panel">
              <h3>{l}<span className="prog">{done}/{its.length}</span></h3>
              {groups.map((gn) => (
                <div key={gn}>
                  <div className="grp">{gn || "Other"}</div>
                  <ul className="checks">
                    {its.filter((p) => (p.group || "") === gn).map((p) => (
                      <li key={p.id} className="erow">
                        <label>
                          <input type="checkbox" checked={p.done} disabled={!canWrite} onChange={(e) => update("pack", p.id, { done: e.target.checked })} />
                          <span>{p.text}</span>
                        </label>
                        <EditBtn table="pack" rec={p} />
                      </li>
                    ))}
                  </ul>
                  <AddBtn table="pack" label={"Add to " + (gn || "this list")} preset={{ list: l, group: gn }} />
                </div>
              ))}
              <AddBtn table="pack" label={"New group in " + l} preset={{ list: l }} />
            </div>
          );
        })}
        {edit && (
          <div className="panel">
            <h3>Another list</h3>
            <p className="note" style={{ margin: "0 0 10px" }}>Type a new list name when you add the first item.</p>
            <AddBtn table="pack" label="Start a new list" />
          </div>
        )}
      </div>
      {!pack.length && !edit && <p className="sub">Nothing on the packing list yet. Tap <b>Edit</b> to start one.</p>}
    </section>
  );
}
