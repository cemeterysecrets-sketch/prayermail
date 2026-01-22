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
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // 🔄 Load prayers live
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  // 🔍 Privacy filter
  function containsFullName(text) {
    return /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text);
  }

  // ➕ Submit prayer
  async function submitPrayer() {
    if (!text.trim()) return;

    if (containsFullName(text)) {
      alert("Please remove full names or identifying details.");
      return;
    }

    const editToken = crypto.randomUUID();

    const ref = await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      answered: false,
      editToken,
      createdAt: Date.now(),
    });

    // 🔐 Save ownership locally
    const owned = JSON.parse(localStorage.getItem("ownedPrayers") || "[]");
    localStorage.setItem(
      "ownedPrayers",
      JSON.stringify([...owned, editToken])
    );

    setTitle("");
    setText("");
  }

  // 🙏 Pray button
  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  // ✏️ Save edit
  async function saveEdit(id) {
    await updateDoc(doc(db, "prayers", id), { text: editText });
    setEditingId(null);
    setEditText("");
  }

  // 🙌 Mark answered
  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), { answered: true });
  }

  // 🗑 Delete prayer
  async function deletePrayer(id) {
    if (confirm("Delete this prayer?")) {
      await deleteDoc(doc(db, "prayers", id));
    }
  }

  // ⏱ Time helper
  function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} days ago`;
  }

  const ownedTokens = JSON.parse(localStorage.getItem("ownedPrayers") || "[]");

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ textAlign: "center", color: "#5f7d8c" }}>PrayerMail</h1>

      <p style={{ textAlign: "center", fontStyle: "italic" }}>
        “Pray for one another, that you may be healed.”  
        <br />— James 5:16
      </p>

      <input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 8 }}
      />

      <textarea
        placeholder="Share your prayer request…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", marginBottom: 8, padding: 8 }}
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
        }}
      >
        Submit Prayer
      </button>

      {prayers.map((p) => {
        const isOwner = ownedTokens.includes(p.editToken);

        return (
          <div
            key={p.id}
            style={{
              background: "#fff",
              padding: 16,
              borderRadius: 12,
              marginTop: 16,
              opacity: p.answered ? 0.6 : 1,
            }}
          >
            <strong>{p.title}</strong>
            <p style={{ fontSize: 12 }}>{timeAgo(p.createdAt)}</p>

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
              <p>{p.text}</p>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => prayFor(p.id)}>
                🙏 {p.prayedCount} I’ll Pray
              </button>

              {isOwner && !p.answered && (
                <>
                  <button onClick={() => {
                    setEditingId(p.id);
                    setEditText(p.text);
                  }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => markAnswered(p.id)}>
                    🙌 Answered
                  </button>
                  <button onClick={() => deletePrayer(p.id)}>
                    🗑 Delete
                  </button>
                </>
              )}

              {p.answered && <span>🙏 Answered</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}


