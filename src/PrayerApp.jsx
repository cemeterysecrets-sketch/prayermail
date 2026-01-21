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

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  function containsFullName(text) {
    return /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text);
  }

  async function submitPrayer() {
    if (!text.trim()) return;

    if (containsFullName(text)) {
      alert("Please remove full names or identifying details.");
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
  window.location.origin + "/#/answer?token=" + editToken
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
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    return `${Math.floor(m / 60)} hr ago`;
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h1 style={{ textAlign: "center", color: "#5f7d8c" }}>
        PrayerMail
      </h1>

      <p style={{
        textAlign: "center",
        fontFamily: "Georgia, serif",
        fontStyle: "italic"
      }}>
        “Pray for one another so that you may be healed.”<br />
        <small>— James 5:16</small>
      </p>

      <input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <textarea
        placeholder="Prayer request"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", height: 80 }}
      />

      <button onClick={submitPrayer}>Submit Prayer</button>

      {privateLink && (
        <div style={{ marginTop: 12 }}>
          <strong>Save this private link:</strong>
          <p style={{ wordBreak: "break-all" }}>{privateLink}</p>
          <button
            onClick={() => navigator.clipboard.writeText(privateLink)}
          >
            Copy Link
          </button>
        </div>
      )}

      <hr />

      {prayers.map((p) => (
        <div key={p.id}>
          <strong>{p.title}</strong>
          <p>{timeAgo(p.createdAt)}</p>
          <p>{p.text}</p>
          {!p.answered && (
            <button onClick={() => prayFor(p.id)}>
              🙏 {p.prayedCount} I’ll Pray
            </button>
          )}
          {p.answered && <p>✨ Prayer Answered</p>}
        </div>
      ))}
    </div>
  );
}

