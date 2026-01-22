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
  const [editToken, setEditToken] = useState(null);
  const [newPrayerId, setNewPrayerId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  /* 🔄 Live prayer feed */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  /* 🔑 Handle ?edit=TOKEN links */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("edit");
    if (token) setEditToken(token);
  }, []);

  function containsFullName(t) {
    return /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(t);
  }

  /* ➕ Submit prayer */
  async function submitPrayer() {
    if (!text.trim()) return;

    if (containsFullName(text)) {
      alert("Please avoid full names or identifying details.");
      return;
    }

    const token = crypto.randomUUID();

    const ref = await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      answered: false,
      editToken: token,
      createdAt: Date.now(),
    });

    setEditToken(token);
    setNewPrayerId(ref.id);
    setTitle("");
    setText("");
  }

  /* 🙏 I'll Pray */
  async function pray(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  /* ✏️ Save edit */
  async function saveEdit(id) {
    await updateDoc(doc(db, "prayers", id), { text: editText });
    setEditingId(null);
  }

  /* 🙌 Mark answered */
  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), { answered: true });
  }

  /* 🗑 Delete */
  async function remove(id) {
    if (!confirm("Delete this prayer?")) return;
    await deleteDoc(doc(db, "prayers", id));
  }

  const button = {
    padding: "4px 8px",
    marginRight: 6,
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#f8f8f8",
    cursor: "pointer",
    fontSize: 13,
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>PrayerMail</h1>

      <input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 6 }}
      />

      <textarea
        placeholder="Share your prayer request..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", height: 80 }}
      />

      <button
        onClick={submitPrayer}
        style={{
          width: "100%",
          padding: 10,
          marginTop: 6,
          background: "#607d8b",
          color: "#fff",
          border: "none",
          borderRadius: 6,
        }}
      >
        Submit Prayer
      </button>

      <hr style={{ margin: "20px 0" }} />

      {prayers.map((p) => {
        const isOwner = editToken && p.editToken === editToken;
        const isNew = p.id === newPrayerId;

        return (
          <div
            key={p.id}
            style={{
              padding: 12,
              marginBottom: 12,
              borderRadius: 8,
              background: "#fff",
              opacity: p.answered ? 0.6 : 1,
            }}
          >
            <strong>{p.title}</strong>
            <div style={{ fontSize: 12, color: "#777" }}>
              {new Date(p.createdAt).toLocaleString()}
            </div>

            {editingId === p.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ width: "100%", marginTop: 6 }}
                />
                <button style={button} onClick={() => saveEdit(p.id)}>
                  💾 Save
                </button>
                <button style={button} onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <p>{p.text}</p>
            )}

            <button style={button} onClick={() => pray(p.id)}>
              🙏 {p.prayedCount} I’ll Pray
            </button>

            {isOwner && (
              <>
                {isNew && (
                  <div style={{ marginTop: 6 }}>
                    🔒 <strong>Private link:</strong>
                    <button
                      style={button}
                      onClick={() =>
                        navigator.clipboard.writeText(
                          `${window.location.origin}?edit=${p.editToken}`
                        )
                      }
                    >
                      📋 Copy Edit Link
                    </button>
                  </div>
                )}

                <button
                  style={button}
                  onClick={() => {
                    setEditingId(p.id);
                    setEditText(p.text);
                  }}
                >
                  ✏️ Edit
                </button>

                <button style={button} onClick={() => markAnswered(p.id)}>
                  🙌 Answered
                </button>

                <button style={button} onClick={() => remove(p.id)}>
                  🗑 Delete
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}


