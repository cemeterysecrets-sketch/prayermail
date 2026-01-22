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

/* =======================
   Firebase Configuration
======================= */
const firebaseConfig = {
  apiKey: "AIzaSyCh9PCMPbe0jjBdwSgQ-rcFynNcVZ9xcUo",
  authDomain: "prayermail-9249a.firebaseapp.com",
  projectId: "prayermail-9249a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =======================
   UI Styles
======================= */
const pillBase = {
  borderRadius: "999px",
  padding: "6px 12px",
  border: "1px solid #d1d5db",
  background: "#f9fafb",
  cursor: "pointer",
  fontSize: "0.8rem",
};

export default function PrayerApp() {
  const [prayers, setPrayers] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editText, setEditText] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  /* =======================
     Live Prayer Feed
  ======================= */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  /* =======================
     Handle Edit Token Link
  ======================= */
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
        const p = snap.docs[0];
        setEditingId(p.id);
        setEditTitle(p.data().title);
        setEditText(p.data().text);
      }
    }

    loadEditablePrayer();
  }, []);

  /* =======================
     Helpers
  ======================= */
  function containsFullName(text) {
    return /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text);
  }

  function timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    return `${Math.floor(hr / 24)} day(s) ago`;
  }

  /* =======================
     Submit Prayer
  ======================= */
  async function submitPrayer() {
    if (!text.trim()) return;

    if (containsFullName(text)) {
      alert("Please avoid full names or identifying details.");
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

    alert(
      `Save this private link to edit or mark answered:\n\n${window.location.origin}/?edit=${editToken}`
    );
  }

  /* =======================
     Actions
  ======================= */
  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  async function saveEdit(id) {
    await updateDoc(doc(db, "prayers", id), {
      title: editTitle,
      text: editText,
    });
    setEditingId(null);
  }

  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), { answered: true });
    setStatusMessage("🙏 Praise God — this prayer has been marked as answered.");
    setTimeout(() => setStatusMessage(""), 4000);
  }

  async function deletePrayer(id) {
    if (!confirm("Delete this prayer?")) return;
    await deleteDoc(doc(db, "prayers", id));
  }

  /* =======================
     Render
  ======================= */
  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ textAlign: "center" }}>PrayerMail</h1>

      {statusMessage && (
        <div
          style={{
            background: "#eef6f0",
            color: "#256f4a",
            padding: 10,
            borderRadius: 8,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {statusMessage}
        </div>
      )}

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
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button
        onClick={submitPrayer}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          background: "#607d8b",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Submit Prayer
      </button>

      <hr style={{ margin: "20px 0" }} />

      {prayers.map((p) => {
        const isEditing = editingId === p.id;

        return (
          <div key={p.id} style={{ marginBottom: 24 }}>
            {isEditing ? (
              <>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: "100%", marginBottom: 6 }}
                />
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ width: "100%", marginBottom: 6 }}
                />
                <button
                  style={{ ...pillBase, background: "#e6f4ea" }}
                  onClick={() => saveEdit(p.id)}
                >
                  💾 Save
                </button>
              </>
            ) : (
              <>
                <strong>{p.title}</strong>
                <div style={{ fontSize: 12, color: "#777" }}>
                  {timeAgo(p.createdAt)}
                </div>

                {p.answered && (
                  <div
                    style={{
                      display: "inline-block",
                      marginTop: 4,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background: "#e6f4ea",
                      color: "#256f4a",
                      fontSize: "0.75rem",
                    }}
                  >
                    🙏 Answered
                  </div>
                )}

                <p>{p.text}</p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    style={{ ...pillBase, background: "#eef6f8" }}
                    onClick={() => prayFor(p.id)}
                  >
                    🙏 {p.prayedCount} I’ll Pray
                  </button>

                  {p.editToken && (
                    <>
                      <button
                        style={pillBase}
                        onClick={() => {
                          setEditingId(p.id);
                          setEditTitle(p.title);
                          setEditText(p.text);
                        }}
                      >
                        ✏️ Edit
                      </button>

                      {!p.answered && (
                        <button
                          style={{ ...pillBase, background: "#fff7ed" }}
                          onClick={() => markAnswered(p.id)}
                        >
                          🙌 Answered
                        </button>
                      )}

                      <button
                        style={{ ...pillBase, background: "#fee2e2" }}
                        onClick={() => deletePrayer(p.id)}
                      >
                        🗑 Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}



