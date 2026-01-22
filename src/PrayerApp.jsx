import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/* 🔐 Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyCh9PCMPbe0jjBdwSgQ-rcFynNcVZ9xcUo",
  authDomain: "prayermail-9249a.firebaseapp.com",
  projectId: "prayermail-9249a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function PrayerApp() {
  const [prayers, setPrayers] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [privateLink, setPrivateLink] = useState("");

  // 🔐 Edit-mode state (Step 1)
  const [editPrayer, setEditPrayer] = useState(null);
  const [editToken, setEditToken] = useState("");

  /* 🔹 Live prayer feed */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  /* 🔹 Handle ?answer=TOKEN (mark answered) */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("answer");
    if (!token) return;

    async function markAnswered() {
      const q = query(
        collection(db, "prayers"),
        where("editToken", "==", token)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { answered: true });
        alert("🙏 This prayer has been marked as answered.");
      }
    }

    markAnswered();
  }, []);

  /* 🔹 Handle ?edit=TOKEN (Step 1: detect edit link) */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("edit");
    if (!token) return;

    async function loadEditablePrayer() {
      const q = query(
        collection(db, "prayers"),
        where("editToken", "==", token)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setEditPrayer({ id: snap.docs[0].id, ...snap.docs[0].data() });
        setEditToken(token);
      }
    }

    loadEditablePrayer();
  }, []);

  function containsFullName(text) {
    return /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text);
  }

  async function submitPrayer() {
    if (!text.trim()) return;

    if (containsFullName(text)) {
      alert(
        "Please remove full names or identifying details. Use phrases like 'a loved one.'"
      );
      return;
    }

    const token = crypto.randomUUID();

    await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      answered: false,
      editToken: token,
      createdAt: Date.now(),
    });

    setPrivateLink(window.location.origin + "/?edit=" + token);
    setTitle("");
    setText("");
  }

  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} minute${m !== 1 ? "s" : ""} ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h !== 1 ? "s" : ""} ago`;
    const d = Math.floor(h / 24);
    return `${d} day${d !== 1 ? "s" : ""} ago`;
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: 20,
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* 🔐 Edit link confirmation (Step 1C) */}
      {editPrayer && (
        <div
          style={{
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          🔐 You opened a private edit link for:
          <strong> {editPrayer.title}</strong>
        </div>
      )}

      <h1 style={{ textAlign: "center", color: "#5f7d8c" }}>
        PrayerMail
      </h1>

      <p style={{ textAlign: "center", fontStyle: "italic", color: "#4b5563" }}>
        “Pray for one another so that you may be healed.”
        <br />— James 5:16
      </p>

      <p style={{ fontSize: 14, textAlign: "center", color: "#6b7280" }}>
        Please do not include full names or identifying details.
      </p>

      <input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", padding: 8, marginTop: 12 }}
      />

      <textarea
        placeholder="Share your prayer request…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", padding: 8, marginTop: 8 }}
      />

      <button
        onClick={submitPrayer}
        style={{
          width: "100%",
          marginTop: 10,
          padding: 10,
          background: "#5f7d8c",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Submit Prayer
      </button>

      {privateLink && (
        <div style={{ marginTop: 16, background: "#eef2f5", padding: 10 }}>
          <strong>Private link (save this):</strong>
          <br />
          <code style={{ wordBreak: "break-all" }}>{privateLink}</code>
        </div>
      )}

      {prayers.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#fff",
            padding: 16,
            marginTop: 16,
            borderRadius: 12,
            opacity: p.answered ? 0.6 : 1,
          }}
        >
          <strong>{p.title}</strong>
          <div style={{ fontSize: 12, color: "#777" }}>
            {timeAgo(p.createdAt)}
          </div>

          <p style={{ whiteSpace: "pre-wrap" }}>{p.text}</p>

          {!p.answered && (
            <button
              onClick={() => prayFor(p.id)}
              style={{
                background: "transparent",
                border: "1px solid #ccc",
                borderRadius: 20,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              🙏 {p.prayedCount} I’ll Pray
            </button>
          )}

          {p.answered && <em>Answered 🙌</em>}
        </div>
      ))}
    </div>
  );
}

