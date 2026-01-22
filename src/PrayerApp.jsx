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
  deleteDoc,
} from "firebase/firestore";

// 🔐 Firebase config
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
  const [urlToken, setUrlToken] = useState(null);

  // 🔹 Load prayers live
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  // 🔹 Read edit token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("edit");
    if (token) setUrlToken(token);
  }, []);

  // 🔍 Prevent full names
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

    const editToken = crypto.randomUUID();

    await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      answered: false,
      editToken,
      createdAt: Date.now(),
    });

    setTitle("");
    setText("");

  }

  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), {
      answered: true,
    });
  }

  async function deletePrayer(id) {
    if (!confirm("Delete this prayer permanently?")) return;
    await deleteDoc(doc(db, "prayers", id));
  }

  function isOwner(prayer) {
    return urlToken && prayer.editToken === urlToken;
  }

  function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: 16,
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#5f7d8c" }}>PrayerMail</h1>

      <p
        style={{
          textAlign: "center",
          fontStyle: "italic",
          color: "#4b5563",
          marginBottom: 16,
          fontFamily: "Georgia, serif",
        }}
      >
        “Pray for one another, that you may be healed.”
        <br />
        <span style={{ fontSize: 13 }}>— James 5:16</span>
      </p>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />

        <textarea
          placeholder="Share your prayer request…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />

        <button
          onClick={submitPrayer}
          style={{
            width: "100%",
            padding: 10,
            background: "#5f7d8c",
            color: "#ffffff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Submit Prayer
        </button>
      </div>

      {prayers.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#ffffff",
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            opacity: p.answered ? 0.75 : 1,
          }}
        >
          <strong>{p.title}</strong>

          <p style={{ fontSize: 12, color: "#777", margin: "4px 0 8px" }}>
            {timeAgo(p.createdAt)}
          </p>

          <p style={{ whiteSpace: "pre-wrap" }}>{p.text}</p>

          {p.answered && (
            <p style={{ color: "#059669", fontWeight: "bold" }}>
              🙌 Answered
            </p>
          )}

          {!p.answered && (
            <button
              onClick={() => prayFor(p.id)}
              style={{
                marginTop: 8,
                background: "transparent",
                color: "#5f7d8c",
                border: "1px solid #d1d5db",
                borderRadius: 999,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              🙏 {p.prayedCount} I’ll Pray
            </button>
          )}

          {isOwner(p) && (
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setTitle(p.title);
                  setText(p.text);
                }}
              >
                ✏️ Edit
              </button>
              <button onClick={() => markAnswered(p.id)}>
                🙌 Mark Answered
              </button>
              <button onClick={() => deletePrayer(p.id)}>🗑 Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


