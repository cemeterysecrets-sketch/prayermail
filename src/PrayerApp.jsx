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
  const [privateLink, setPrivateLink] = useState("");

  // 🔹 Load prayers live
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  // 🔹 Handle ?answer=TOKEN links (NO ROUTING, NO 404)
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

    setPrivateLink(
      window.location.origin + "/?answer=" + editToken
    );

    setTitle("");
    setText("");
  }

  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  function timeAgo(ts) {
    const minutes = Math.floor((Date.now() - ts) / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)} hr ago`;
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
      <h1 style={{ textAlign: "center", color: "#5f7d8c" }}>
        PrayerMail
      </h1>

      <p
        style={{
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          color: "#4b5563",
          marginBottom: 16,
        }}
      >
        “Pray for one another so that you may be healed.”
        <br />
        <small>— James 5:16</small>
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

      {privateLink && (
        <div
          style={{
            marginTop: 16,
            background: "#eef2f5",
            padding: 12,
            borderRadius: 8,
            fontSize: 14,
          }}
        >
          <strong>Private link (save this):</strong>
          <p style={{ wordBreak: "break-all", margin: "6px 0" }}>
            {privateLink}
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(privateLink)}
          >
            Copy Link
          </button>
        </div>
      )}

      <hr style={{ margin: "24px 0" }} />

      {prayers.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#ffffff"
