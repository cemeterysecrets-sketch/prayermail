import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  increment,
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
  const [activeEditToken, setActiveEditToken] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  /* 🔹 Load prayers live */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  /* 🔹 Capture edit token from URL */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("edit");
    if (token) setActiveEditToken(token);
  }, []);

  function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  }

  async function submitPrayer() {
    if (!text.trim()) return;

    const editToken = crypto.randomUUID();

    await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      answered: false,
      editToken,
      createdAt: Date.now(),
    });

    const editLink =
      window.location.origin + "/?edit=" + editToken;

    alert(
      "Save this private link to edit or mark your prayer as answered:\n\n" +
        editLink
    );

    setTitle("");
    setText("");
  }

  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  async function saveEdit(id) {
    await updateDoc(doc(db, "prayers", id), {
      text: editText,
    });
    setEditingId(null);
  }

  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), {
      answered: true,
    });
  }

  async function deletePrayer(id) {
    if (confirm("Delete this prayer?")) {
      await deleteDoc(doc(db, "prayers", id));
    }
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
          fontStyle: "italic",
          color: "#6b7280",
          marginBottom: 16,
        }}
      >
        “Pray for one another, that you may be healed.”
        <br />— James 5:16
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
          color: "#fff",
          border: "none",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        Submit Prayer
      </button>

      {prayers.map((p) => {
        const isOwner = activeEditToken === p.editToken;

        return (
          <div
            key={p.id}
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              opacity: p.answered ? 0.7 : 1,
            }}
          >
            <strong>{p.title}</strong>

            <p style={{ fontSize: 12, color: "#777" }}>
              {timeAgo(p.createdAt)}
              {p.answered && " • Answered 🙌"}
            </p>

            {editingId === p.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
                <button onClick={() => saveEdit(p.id)}>Save</button>
              </>
            ) : (
              <p style={{ whiteSpace: "pre-wrap" }}>{p.text}</p>
            )}

            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => prayFor(p.id)}
                style={{ marginRight: 8 }}
              >
                🙏 {p.prayedCount} I’ll Pray
              </button>

              {isOwner && !p.answered && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditText(p.text);
                    }}
                    style={{ marginRight: 6 }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => markAnswered(p.id)}
                    style={{ marginRight: 6 }}
                  >
                    🙌 Answered
                  </button>

                  <button onClick={() => deletePrayer(p.id)}>
                    🗑 Delete
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


