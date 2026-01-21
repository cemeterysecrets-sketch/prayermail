// redeploy trigger
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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  function containsFullName(text) {
    const fullNamePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/;
    const titledNamePattern = /\b(Mr|Mrs|Ms|Miss|Dr)\.?\s+[A-Z][a-z]+\b/;
    return fullNamePattern.test(text) || titledNamePattern.test(text);
  }

  async function submitPrayer() {
    if (!text.trim()) return;

    if (containsFullName(text)) {
      alert(
        "Please remove full names or identifying details. Use phrases like 'my aunt' or 'a loved one.'"
      );
      return;
    }

    await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
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
    <h1 style={{ textAlign: "center", color: "red" }}>
  THIS IS PRAYERAPP
      </h1>
<p
  style={{
    textAlign: "center",
    fontSize: 15,
    color: "#4b5563",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontStyle: "italic",
    lineHeight: 1.6,
    maxWidth: 420,
    margin: "0 auto 18px",
  }}
>
  “Pray for one another so that you may be healed.”
  <br />
  <span
    style={{
      display: "block",
      marginTop: 6,
      fontSize: 13,
      fontStyle: "normal",
      color: "#6b7280",
    }}
  >
    — James 5:16
  </span>
</p>

      <p
        style={{
          fontSize: 14,
          color: "#6b7280",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Please do not include full names or identifying details. Use general
        phrases like <em>my aunt</em>, <em>a coworker</em>, or{" "}
        <em>a loved one</em>.
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
          }}
        >
          <strong>{p.title}</strong>

          <p style={{ fontSize: 12, color: "#777", margin: "4px 0 8px" }}>
            {timeAgo(p.createdAt)}
          </p>

          <p style={{ whiteSpace: "pre-wrap" }}>{p.text}</p>

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
        </div>
      ))}
    </div>
  );
}
