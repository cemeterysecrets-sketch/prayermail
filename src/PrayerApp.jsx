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

/* 🎨 Shared button style */
const actionButton = {
  padding: "6px 12px",
  borderRadius: "999px",
  border: "1px solid #d1d5db",
  background: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
};

export default function PrayerApp() {
  const [prayers, setPrayers] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editToken, setEditToken] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  /* 🔄 Load prayers live */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  /* 🔗 Handle edit/answer links */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("edit");

    if (!token) return;

    async function findOwnedPrayer() {
      const q = query(collection(db, "prayers"), where("editToken", "==", token));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setEditToken(token);
      }
    }

    findOwnedPrayer();
  }, []);

  /* 🚫 Block full names */
  function containsFullName(text) {
    return /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text);
  }

  /* ➕ Submit prayer */
  async function submitPrayer() {
    if (!text.trim()) return;

    if (containsFullName(text)) {
      alert("Please avoid full names. Use phrases like 'a loved one.'");
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

    setEditToken(token);
    setTitle("");
    setText("");

    alert(
      `Save this private link to edit or mark answered:\n\n${window.location.origin}?edit=${token}`
    );
  }

  /* 🙏 Pray button */
  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  /* ✏️ Save edit */
  async function saveEdit(id) {
    await updateDoc(doc(db, "prayers", id), { text: editText });
    setEditingId(null);
    setEditText("");
  }

  /* 🙌 Mark answered */
  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), { answered: true });
  }

  /* 🗑 Delete prayer */
  async function deletePrayer(id) {
    if (confirm("Delete this prayer?")) {
      await deleteDoc(doc(db, "prayers", id));
    }
  }

  function timeAgo(ts) {
    const sec = Math.floor((Date.now() - ts) / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    return `${Math.floor(hr / 24)} days ago`;
  }

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
        style={{ width: "100%", marginBottom: 8 }}
      />

      <textarea
        placeholder="Share your prayer request..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <button
        onClick={submitPrayer}
        style={{
          width: "100%",
          padding: 10,
          background: "#5f7d8c",
          color: "#fff",
          borderRadius: 8,
          border: "none",
        }}
      >
        Submit Prayer
      </button>

      {prayers.map((p) => {
        const isOwner = editToken && p.editToken === editToken;

        return (
          <div key={p.id} style={{ marginTop: 20 }}>
            <strong>{p.title}</strong>
            <div style={{ fontSize: 12, color: "#777" }}>
              {timeAgo(p.createdAt)}
              {p.answered && " • Answered 🙌"}
            </div>

            {editingId === p.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  style={{ width: "100%", marginTop: 6 }}
                />
                <button
                  style={actionButton}
                  onClick={() => saveEdit(p.id)}
                >
                  💾 Save
                </button>
              </>
            ) : (
              <p>{p.text}</p>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                style={actionButton}
                onClick={() => prayFor(p.id)}
              >
                🙏 {p.prayedCount} I’ll Pray
              </button>

              {isOwner && (
                <>
                  <button
                    style={actionButton}
                    onClick={() => {
                      setEditingId(p.id);
                      setEditText(p.text);
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    style={actionButton}
                    onClick={() => markAnswered(p.id)}
                  >
                    🙌 Answered
                  </button>

                  <button
                    style={actionButton}
                    onClick={() => deletePrayer(p.id)}
                  >
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

