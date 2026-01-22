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

/* helpers */
function ownsPrayer(prayerId, token) {
  const stored = JSON.parse(localStorage.getItem("myPrayerTokens") || "{}");
  return stored[prayerId] === token;
}

function saveOwnership(prayerId, token) {
  const stored = JSON.parse(localStorage.getItem("myPrayerTokens") || "{}");
  stored[prayerId] = token;
  localStorage.setItem("myPrayerTokens", JSON.stringify(stored));
}

export default function PrayerApp() {
  const [prayers, setPrayers] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  /* 🔄 Live load prayers */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  /* 📨 Handle ?edit=TOKEN links */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("edit");
    if (!token) return;

    prayers.forEach((p) => {
      if (p.editToken === token) {
        saveOwnership(p.id, token);
      }
    });
  }, [prayers]);

  async function submitPrayer() {
    if (!text.trim()) return;

    const editToken = crypto.randomUUID();

    const docRef = await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      answered: false,
      editToken,
      createdAt: Date.now(),
    });

    saveOwnership(docRef.id, editToken);

    setTitle("");
    setText("");
  }

  async function pray(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), { answered: true });
  }

  async function saveEdit(id) {
    await updateDoc(doc(db, "prayers", id), { text: editText });
    setEditingId(null);
    setEditText("");
  }

  async function removePrayer(id) {
    if (!confirm("Delete this prayer?")) return;
    await deleteDoc(doc(db, "prayers", id));
  }

  function copyEditLink(token) {
    const link = `${window.location.origin}/?edit=${token}`;
    navigator.clipboard.writeText(link);
    alert("Private edit link copied");
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20 }}>
      <h1 style={{ textAlign: "center" }}>PrayerMail</h1>

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
        rows={4}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button style={{ width: "100%" }} onClick={submitPrayer}>
        Submit Prayer
      </button>

      <hr />

      {prayers.map((p) => {
        const isOwner = ownsPrayer(p.id, p.editToken);

        return (
          <div key={p.id} style={{ marginBottom: 20 }}>
            <strong>{p.title}</strong>
            <div style={{ fontSize: 12, color: "#666" }}>
              {new Date(p.createdAt).toLocaleString()}
            </div>

            {editingId === p.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  style={{ width: "100%" }}
                />
                <button onClick={() => saveEdit(p.id)}>Save</button>
              </>
            ) : (
              <p>{p.text}</p>
            )}

            {p.answered && <div>🙏 Answered</div>}

            <button onClick={() => pray(p.id)}>
              🙏 {p.prayedCount} I’ll Pray
            </button>

            {isOwner && (
              <>
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  🔒 Private
                  <button
                    style={{ marginLeft: 6 }}
                    onClick={() => copyEditLink(p.editToken)}
                  >
                    Copy Edit Link
                  </button>
                </div>

                <div style={{ marginTop: 6 }}>
                  <button onClick={() => {
                    setEditingId(p.id);
                    setEditText(p.text);
                  }}>
                    ✏️ Edit
                  </button>

                  {!p.answered && (
                    <button onClick={() => markAnswered(p.id)}>
                      🙌 Answered
                    </button>
                  )}

                  <button onClick={() => removePrayer(p.id)}>
                    🗑 Delete
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

