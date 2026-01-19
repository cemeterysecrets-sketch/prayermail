import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";

// <-- Paste your Firebase config here -->
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function PrayerApp() {
  const prayersRef = collection(db, "prayers");
  const [prayers, setPrayers] = useState([]);
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(prayersRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  async function submitPrayer() {
    if (!text.trim()) return;
    await addDoc(prayersRef, {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      createdAt: Date.now(),
    });
    setText("");
    setTitle("");
  }

  async function prayFor(id) {
    const ref = doc(db, "prayers", id);
    await updateDoc(ref, { prayedCount: increment(1) });
  }

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "16px" }}>
      <h1 style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold" }}>PrayerWall</h1>

      <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
        <input
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          style={{ width: "100%", padding: "8px", marginBottom: "8px" }}
          placeholder="Share your prayer request…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button style={{ width: "100%", padding: "8px" }} onClick={submitPrayer}>
          Submit Prayer
        </button>
      </div>

      {prayers.map((p) => (
        <div
          key={p.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ fontWeight: "bold" }}>{p.title}</h2>
          <p>{p.text}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🙏 {p.prayedCount} praying</span>
            <button onClick={() => prayFor(p.id)}>I’ll Pray</button>
          </div>
        </div>
      ))}
    </div>
  );
}
