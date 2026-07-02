import { useState, useEffect, useCallback } from "react";
import { BookOpen, Users, ArrowLeftRight, AlertTriangle, Plus, Trash2, Search } from "lucide-react";

const API = "http://localhost:4000/api";

const COLORS = {
  bg: "#0B0E14",
  panel: "#12161F",
  border: "#1F2530",
  text: "#E6E8EC",
  muted: "#7B8496",
  base: "#3E5C9A",
  accent: "#F5A623",
  danger: "#FF5D73",
  success: "#3FB68B",
};
const FONT_MONO = "'JetBrains Mono', 'Fira Code', monospace";
const FONT_SANS = "'Inter', system-ui, sans-serif";

const TABS = [
  { key: "books", label: "Books", icon: BookOpen },
  { key: "members", label: "Members", icon: Users },
  { key: "transactions", label: "Issue / Return", icon: ArrowLeftRight },
  { key: "dashboard", label: "Overdue", icon: AlertTriangle },
];

export default function LibraryApp() {
  const [tab, setTab] = useState("books");

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_SANS, minHeight: "100%", padding: "28px 20px", borderRadius: 12 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontFamily: FONT_MONO, fontSize: 20, margin: "0 0 18px" }}>
          <span style={{ color: COLORS.accent }}>&gt;</span> library-system
        </h1>

        <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 10 }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: tab === key ? COLORS.accent : COLORS.panel,
                color: tab === key ? "#151515" : COLORS.text,
                border: `1px solid ${tab === key ? COLORS.accent : COLORS.border}`,
                borderRadius: 6, padding: "8px 12px", fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer",
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === "books" && <BooksPanel />}
        {tab === "members" && <MembersPanel />}
        {tab === "transactions" && <TransactionsPanel />}
        {tab === "dashboard" && <OverduePanel />}
      </div>
    </div>
  );
}

// ---------- shared bits ----------
function inputStyle(w) {
  return { width: w || "auto", background: COLORS.panel, color: COLORS.text, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "8px 10px", fontFamily: FONT_MONO, fontSize: 12 };
}
function btnStyle(kind) {
  const bg = kind === "danger" ? COLORS.danger : kind === "accent" ? COLORS.accent : COLORS.panel;
  return { display: "flex", alignItems: "center", gap: 6, background: bg, color: kind ? "#151515" : COLORS.text, border: `1px solid ${bg}`, borderRadius: 6, padding: "7px 12px", fontFamily: FONT_MONO, fontSize: 12, cursor: "pointer" };
}
function Card({ children }) {
  return <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>{children}</div>;
}
function ErrorText({ msg }) {
  if (!msg) return null;
  return <p style={{ color: COLORS.danger, fontFamily: FONT_MONO, fontSize: 12 }}>{msg}</p>;
}

// ---------- Books ----------
function BooksPanel() {
  const [books, setBooks] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ title: "", author: "", genre: "", total_copies: 1 });
  const [error, setError] = useState("");

  const load = useCallback(async (query) => {
    try {
      const res = await fetch(`${API}/books${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      if (!res.ok) throw new Error("failed to load books");
      setBooks(await res.json());
    } catch (e) {
      setError("Could not reach the backend — is `node server.js` running on port 4000?");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addBook = async () => {
    if (!form.title || !form.author) { setError("title and author are required"); return; }
    setError("");
    const res = await fetch(`${API}/books`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, total_copies: Number(form.total_copies) || 1 }),
    });
    if (res.ok) { setForm({ title: "", author: "", genre: "", total_copies: 1 }); load(q); }
  };

  const removeBook = async (id) => { await fetch(`${API}/books/${id}`, { method: "DELETE" }); load(q); };

  return (
    <>
      <Card>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={inputStyle(160)} placeholder="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input style={inputStyle(140)} placeholder="author" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          <input style={inputStyle(120)} placeholder="genre" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} />
          <input style={inputStyle(70)} type="number" min={1} placeholder="copies" value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: e.target.value })} />
          <button style={btnStyle("accent")} onClick={addBook}><Plus size={14} /> add book</button>
        </div>
        <ErrorText msg={error} />
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input style={inputStyle(220)} placeholder="search title / author / genre" value={q} onChange={(e) => { setQ(e.target.value); load(e.target.value); }} />
        <span style={{ color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Search size={12} /> {books.length} results</span>
      </div>

      <Table
        headers={["Title", "Author", "Genre", "Available", ""]}
        rows={books.map((b) => [
          b.title, b.author, b.genre || "-",
          `${b.available_copies}/${b.total_copies}`,
          <button key="del" style={btnStyle("danger")} onClick={() => removeBook(b.id)}><Trash2 size={12} /></button>,
        ])}
      />
    </>
  );
}

// ---------- Members ----------
function MembersPanel() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/members`);
      setMembers(await res.json());
    } catch { setError("Could not reach the backend — is `node server.js` running on port 4000?"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const addMember = async () => {
    if (!form.name || !form.email) { setError("name and email are required"); return; }
    const res = await fetch(`${API}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) { setForm({ name: "", email: "", phone: "" }); setError(""); load(); }
    else { const d = await res.json(); setError(d.error || "could not add member"); }
  };
  const removeMember = async (id) => { await fetch(`${API}/members/${id}`, { method: "DELETE" }); load(); };

  return (
    <>
      <Card>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={inputStyle(160)} placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input style={inputStyle(180)} placeholder="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input style={inputStyle(140)} placeholder="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <button style={btnStyle("accent")} onClick={addMember}><Plus size={14} /> add member</button>
        </div>
        <ErrorText msg={error} />
      </Card>

      <Table
        headers={["Name", "Email", "Phone", ""]}
        rows={members.map((m) => [
          m.name, m.email, m.phone || "-",
          <button key="del" style={btnStyle("danger")} onClick={() => removeMember(m.id)}><Trash2 size={12} /></button>,
        ])}
      />
    </>
  );
}

// ---------- Transactions (issue / return) ----------
function TransactionsPanel() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [txns, setTxns] = useState([]);
  const [bookId, setBookId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    try {
      const [b, m, t] = await Promise.all([
        fetch(`${API}/books`).then((r) => r.json()),
        fetch(`${API}/members`).then((r) => r.json()),
        fetch(`${API}/transactions`).then((r) => r.json()),
      ]);
      setBooks(b); setMembers(m); setTxns(t);
    } catch { setError("Could not reach the backend — is `node server.js` running on port 4000?"); }
  }, []);
  useEffect(() => { loadAll(); }, [loadAll]);

  const issueBook = async () => {
    if (!bookId || !memberId) { setError("select a book and a member"); return; }
    const res = await fetch(`${API}/transactions/issue`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ book_id: Number(bookId), member_id: Number(memberId), days: 14 }),
    });
    if (res.ok) { setError(""); loadAll(); }
    else { const d = await res.json(); setError(d.error || "could not issue book"); }
  };

  const returnBook = async (id) => { await fetch(`${API}/transactions/${id}/return`, { method: "POST" }); loadAll(); };

  return (
    <>
      <Card>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select style={inputStyle(200)} value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="">select book</option>
            {books.filter((b) => b.available_copies > 0).map((b) => (
              <option key={b.id} value={b.id}>{b.title} ({b.available_copies} left)</option>
            ))}
          </select>
          <select style={inputStyle(160)} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">select member</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <button style={btnStyle("accent")} onClick={issueBook}>issue (14 days)</button>
        </div>
        <ErrorText msg={error} />
      </Card>

      <Table
        headers={["Book", "Member", "Issued", "Due", "Status", ""]}
        rows={txns.map((t) => [
          t.book_title, t.member_name, t.issue_date, t.due_date,
          t.status,
          t.status === "issued"
            ? <button key="ret" style={btnStyle()} onClick={() => returnBook(t.id)}>mark returned</button>
            : <span key="ret" style={{ color: COLORS.success, fontFamily: FONT_MONO, fontSize: 11 }}>returned {t.return_date}</span>,
        ])}
      />
    </>
  );
}

// ---------- Dashboard (overdue) ----------
function OverduePanel() {
  const [overdue, setOverdue] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/transactions/overdue`)
      .then((r) => r.json())
      .then(setOverdue)
      .catch(() => setError("Could not reach the backend — is `node server.js` running on port 4000?"));
  }, []);

  return (
    <>
      <ErrorText msg={error} />
      {overdue.length === 0 && !error && (
        <p style={{ color: COLORS.muted, fontFamily: FONT_MONO, fontSize: 13 }}>// no overdue books right now</p>
      )}
      {overdue.length > 0 && (
        <Table
          headers={["Book", "Member", "Due Date"]}
          rows={overdue.map((t) => [t.book_title, t.member_name, <span key="d" style={{ color: COLORS.danger }}>{t.due_date}</span>])}
        />
      )}
    </>
  );
}

// ---------- Table ----------
function Table({ headers, rows }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: FONT_MONO, fontSize: 12 }}>
        <thead>
          <tr style={{ background: COLORS.bg }}>
            {headers.map((h, i) => (
              <th key={i} style={{ textAlign: "left", padding: "10px 12px", color: COLORS.muted, fontWeight: 500, borderBottom: `1px solid ${COLORS.border}` }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} style={{ padding: "14px 12px", color: COLORS.muted }}>no records yet</td></tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {row.map((cell, j) => <td key={j} style={{ padding: "10px 12px" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}