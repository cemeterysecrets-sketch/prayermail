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
  const [editToken, setEditToken] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [privateLinks, setPrivateLinks] = useState({});

  // Load live prayers
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  // Handle answered link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ans = params.get("answer");
    if (ans) {
      async function markAnswered() {
        const q = query(
          collection(db, "prayers"),
          where("editToken", "==", ans)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, { answered: true });
          alert("🙏 This prayer has been marked as answered.");
        }
      }
      markAnswered();
    }
  }, []);

  // Handle edit link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editTokenParam = params.get("edit");
    if (!editTokenParam) return;

    async function loadForEdit() {
      const q = query(
        collection(db, "prayers"),
        where("editToken", "==", editTokenParam)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const prayer = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setEditingId(prayer.id);
        setTitle(prayer.title);
        setText(prayer.text);
        setEditToken(editTokenParam);
      }
    }
    loadForEdit();
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

    const docRef = await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      answered: false,
      editToken: token,
      createdAt: Date.now(),
    });

    setPrivateLinks({
      answered: window.location.origin + "/?answer=" + token,
      edit: window.location.origin + "/?edit=" + token,
      id: docRef.id,
    });

    setTitle("");
    setText("");
  }

  async function saveEdits() {
    if (!editingId) return;

    await updateDoc(doc(db, "prayers", editingId), {
      title,
      text,
    });

    alert("✏️ Prayer updated!");
    setEditingId(null);
    setEditToken("");
    setTitle("");
    setText("");
  }

  async function deletePrayer(id) {
    if (!window.confirm("Are you sure you want to delete this prayer?"))
      return;
    await deleteDoc(doc(db, "prayers", id));
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
      <h1 style={{ textAlign: "center", color: "#5f7d8c" }}>
        PrayerMail
      </h1>

      <p
        style={{
          textAlign: "center",
          fontStyle: "italic",
          color: "#4b5563",
        }}
      >
        “Pray for one another so that you may be healed.”
        <br />
        — James 5:16
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

      {editingId ? (
        <>
          <button
            onClick={saveEdits}
            style={{
              width: "100%",
              padding: 10,
              background: "#facc15",
              color: "#000",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
          <button
            onClick={() => deletePrayer(editingId)}
            style={{
              width: "100%",
              padding: 10,
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            Delete Prayer
          </button>
        </>
      ) : (
        <button
          onClick={submitPrayer}
          style={{
            width: "100%",
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
      )}
{privateLinks.edit && (
  <div
    style={{
      marginTop: 16,
      background: "#eef2f5",
      padding: 12,
      borderRadius: 8,
      fontSize: 14,
    }}
  >
    <strong>Save these private links:</strong>

    <div style={{ marginTop: 8 }}>
      <div><strong>Edit or delete:</strong></div>
      <code style={{ wordBreak: "break-all" }}>
        {privateLinks.edit}
      </code>
    </div>

    <div style={{ marginTop: 8 }}>
      <div><strong>Mark as answered:</strong></div>
      <code style={{ wordBreak: "break-all" }}>
        {privateLinks.answered}
      </code>
    </div>

    <p style={{ marginTop: 8, fontStyle: "italic", color: "#555" }}>
      Anyone with these links can manage this prayer. Keep them private.
    </p>
  </div>
)}

      <hr style={{ margin: "24px 0" }} />

      {prayers.map((p) => (
        <div
          key={p.id}
          style={{
            background: "#fff",
            padding: 16,
            marginTop: 16,
            borderRadius: 12,
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
                padding: 6,
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

