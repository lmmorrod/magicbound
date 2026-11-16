"use client";
import { budgetTotals, isNum, money } from "@/lib/plan";
import { useStore } from "./store";
import { AddBtn, EditBtn } from "./RecButtons";

export function BudgetTab() {
  const { data, edit } = useStore();
  const { budget, trip } = data;
  const m = (n: number) => money(n, trip.currency);
  const t = budgetTotals(budget);
  return (
    <section id="budget">
      <h2>Budget</h2>
      <p className="sub">Everything the trip costs. Tap <b>Edit</b> to add lines, price things up or update what you&apos;ve paid.</p>
      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="panel">
          <h3>Total so far</h3><div className="big">{m(t.total)}</div>
          <div className="meter" aria-hidden="true" style={{ "--k": "var(--accent)" } as React.CSSProperties}>
            <span className="s" style={{ flex: t.paid }} /><span style={{ flex: t.left || 0.0001 }} />
          </div>
        </div>
        <div className="panel"><h3>Paid</h3><div className="big">{m(t.paid)}</div></div>
        <div className="panel">
          <h3>Left to pay</h3><div className="big">{m(t.left)}</div>
          <p className="note" style={{ marginTop: 6 }}>{t.toPrice ? `${t.toPrice} line${t.toPrice > 1 ? "s" : ""} still to price` : "Everything's priced"}</p>
        </div>
      </div>
      <div className="panel">
        <div className="scroll">
          <table>
            <thead>
              <tr><th>What</th><th style={{ textAlign: "right" }}>Cost</th><th style={{ textAlign: "right" }}>Paid</th><th style={{ textAlign: "right" }}>Left</th>{edit && <th />}</tr>
            </thead>
            <tbody>
              {budget.length ? budget.map((b) => {
                const c = isNum(b.cost);
                return (
                  <tr key={b.id}>
                    <td>{b.name}{b.note && <div className="note" style={{ marginTop: 2 }}>{b.note}</div>}</td>
                    <td className="n">{c ? m(b.cost!) : <span className="pill todo">To price</span>}</td>
                    <td className="n">{+b.paid ? m(b.paid) : <span className="muted">None yet</span>}</td>
                    <td className="n">{c ? m(Math.max(0, b.cost! - (+b.paid || 0))) : <span className="muted">Not priced</span>}</td>
                    {edit && <td style={{ width: "1%" }}><EditBtn table="budget" rec={b} /></td>}
                  </tr>
                );
              }) : <tr><td colSpan={5} className="note">No budget lines yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <AddBtn table="budget" label="Add a budget line" />
      </div>
    </section>
  );
}
