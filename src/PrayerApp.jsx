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
  const [editTokenFromUrl, setEditTokenFromUrl] = useState(null);
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

  /* 🔐 Read edit token from URL */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("edit");
    if (token) setEditTokenFromUrl(token);
  }, []);

  function containsFullName(text) {
    return /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text);
  }

  /* ➕ Submit prayer */
  async function submitPrayer() {
    if (!text.trim()) return;

    if (containsFullName(text)) {
      alert("Please avoid full names. Use phrases like ‘a loved one’.");
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

    alert(
      "Save this private link to edit or mark answered:\n\n" +
        window.location.origin +
        "/?edit=" +
        editToken
    );

    setTitle("");
    setText("");
  }

  /* 🙏 Pray */
  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  /* ✏️ Start editing */
  function startEdit(prayer) {
    setEditingId(prayer.id);
    setEditText(prayer.text);
  }

  /* 💾 Save edit */
  async function saveEdit(id) {
    await updateDoc(doc(db, "prayers", id), { text: editText });
    setEditingId(null);
  }

  /* 🙌 Mark answered */
  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), { answered: true });
  }

  /* 🗑 Delete */
  async function deletePrayer(id) {
    if (!confirm("Delete this prayer?")) return;
    await deleteDoc(doc(db, "prayers", id));
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr ago`;
    return `${Math.floor(h / 24)} days ago`;
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ textAlign: "center" }}>PrayerMail</h1>

      <input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <textarea
        placeholder="Share your prayer request…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <button onClick={submitPrayer} style={{ width: "100%", marginBottom: 16 }}>
        Submit Prayer
      </button>

      {prayers.map((p) => {
        const isOwner = editTokenFromUrl === p.editToken;

        return (
          <div key={p.id} style={{ marginBottom: 20 }}>
            <strong>{p.title}</strong>
            <div style={{ fontSize: 12 }}>{timeAgo(p.createdAt)}</div>

            {editingId === p.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ width: "100%" }}
                />
                <button onClick={() => saveEdit(p.id)}>Save</button>
              </>
            ) : (
              <p>{p.text}</p>
            )}

            {p.answered && <span>🙏 Answered</span>}

            <div style={{ marginTop: 6 }}>
              <button onClick={() => prayFor(p.id)}>
                🙏 {p.prayedCount} I’ll Pray
              </button>

              {isOwner && (
                <>
                  <button onClick={() => startEdit(p)}>✏️ Edit</button>
                  {!p.answered && (
                    <button onClick={() => markAnswered(p.id)}>
                      🙌 Answered
                    </button>
                  )}
                  <button onClick={() => deletePrayer(p.id)}>🗑 Delete</button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}



