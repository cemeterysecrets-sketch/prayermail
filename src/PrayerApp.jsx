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

// 🔐 Your Firebase config (keep your real values here)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
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

  async function submitPrayer() {
    if (!text.trim()) return;
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

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ textAlign: "center" }}>PrayerMail</h1>

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
        <button onClick={submitPrayer} style={{ width: "100%", padding: 8 }}>
          Submit Prayer
        </button>
      </div>

      {prayers.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ddd",
            padding: 12,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <strong>{p.title}</strong>
          <p>{p.text}</p>
          <button onClick={() => prayFor(p.id)}>
            🙏 {p.prayedCount} I’ll Pray
          </button>
        </div>
      ))}
    </div>
  );
}
