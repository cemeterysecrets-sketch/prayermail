import { useEffect, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  deleteDoc,
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
  const [musicOn, setMusicOn] = useState(
    localStorage.getItem("musicOn") === "true"
  );

  const audioRef = useRef(null);

  // 🎵 Music
  useEffect(() => {
    if (!audioRef.current) return;
    musicOn ? audioRef.current.play() : audioRef.current.pause();
  }, [musicOn]);

  function toggleMusic() {
    const next = !musicOn;
    setMusicOn(next);
    localStorage.setItem("musicOn", next);
  }

  // 🔄 Live prayers
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
      alert(
        "Please remove full names or identifying details. Use phrases like 'a loved one.'"
      );
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

    localStorage.setItem(`owner-${ref.id}`, editToken);

    setTitle("");
    setText("");
  }

  async function prayFor(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  async function editPrayer(p) {
    const updated = prompt("Edit your prayer:", p.text);
    if (!updated) return;

    await updateDoc(doc(db, "prayers", p.id), {
      text: updated,
    });
  }

  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), {
      answered: true,
    });
  }

  async function deletePrayer(id) {
    const ok = window.confirm(
      "Are you sure you want to permanently delete this prayer?"
    );
    if (!ok) return;

    await deleteDoc(doc(db, "prayers", id));
    localStorage.removeItem(`owner-${id}`);
  }

  function isOwner(p) {
    return localStorage.getItem(`owner-${p.id}`) === p.editToken;
  }

  function copyLink(p) {
    const url = window.location.origin + "/?answer=" + p.editToken;
    navigator.clipboard.writeText(url);
    alert("Private link copied. Save it somewhere safe.");
  }

  function timeAgo(ts) {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} day(s) ago`;
  }

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "40px auto",
        padding: 32,
        background: "#fafaf8",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        fontFamily: "Georgia, serif",
      }}
    >
      <audio ref={audioRef} src="/harp.mp3" loop />

      <h1 style={{ textAlign: "center", color: "#5f7d78" }}>
        PrayerMail
      </h1>

      <div
        style={{
          textAlign: "center",
          fontStyle: "italic",
          color: "#777",
          marginBottom: 18,
        }}
      >
        “Pray for one another, that you may be healed.”
        <br />
        <span style={{ fontSize: 13 }}>— James 5:16</span>
      </div>

      <div
        style={{
          textAlign: "center",
          color: "#6b7280",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 22,
        }}
      >
        This is a quiet space to share prayer requests and to lift up the needs of
        others.
        <br />
        You may submit a prayer anonymously, or pray for someone else by tapping
        “I’ll Pray.”
      </div>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <button
          onClick={toggleMusic}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #ccc",
            background: "#f4f7f6",
            cursor: "pointer",
          }}
        >
          🎵 {musicOn ? "Pause Music" : "Play Music"}
        </button>
      </div>

      <input
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 10,
        }}
      />

      <textarea
        placeholder="Share your prayer request…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ccc",
          marginBottom: 14,
        }}
      />

      <button
        onClick={submitPrayer}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          background: "#6b8f8a",
          color: "white",
          border: "none",
          fontSize: 16,
          cursor: "pointer",
          marginBottom: 30,
        }}
      >
        Submit Prayer
      </button>

      {prayers.map((p) => (
        <div
          key={p.id}
          style={{
            background: "white",
            borderRadius: 14,
            padding: 18,
            marginBottom: 20,
            boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
          }}
        >
          <strong>{p.title}</strong>
          <div style={{ fontSize: 12, color: "#777" }}>
            {timeAgo(p.createdAt)}
          </div>

          <p style={{ whiteSpace: "pre-wrap" }}>{p.text}</p>

          {p.answered && (
            <div
              style={{
                display: "inline-block",
                marginBottom: 8,
                padding: "4px 10px",
                borderRadius: 999,
                background: "#e7f2ee",
                color: "#3f6f64",
                fontSize: 13,
              }}
            >
              🙏 Prayer Answered
            </div>
          )}

          <div>
            <button
              onClick={() => prayFor(p.id)}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #ddd",
                background: "#f4f7f6",
                marginRight: 6,
                cursor: "pointer",
              }}
            >
              🙏 {p.prayedCount} I’ll Pray
            </button>

            {isOwner(p) && (
              <>
                <button
                  onClick={() => copyLink(p)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #ddd",
                    background: "#f4f7f6",
                    marginRight: 6,
                    cursor: "pointer",
                  }}
                >
                  📋 Copy Link
                </button>

                <button
                  onClick={() => editPrayer(p)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #ddd",
                    background: "#f4f7f6",
                    marginRight: 6,
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit
                </button>

                {!p.answered && (
                  <button
                    onClick={() => markAnswered(p.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #ddd",
                      background: "#f4f7f6",
                      marginRight: 6,
                      cursor: "pointer",
                    }}
                  >
                    🙌 Answered
                  </button>
                )}

                <button
                  onClick={() => deletePrayer(p.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    cursor: "pointer",
                    color: "#7c2d12",
                  }}
                >
                  🗑 Delete
                </button>
              </>
            )}
          </div>
        </div>
      ))}

      {/* 🌿 Footer */}
      <div
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid #e5e7eb",
          textAlign: "center",
          fontSize: 13,
          color: "#9ca3af",
          lineHeight: 1.6,
        }}
      >
        If this space has been helpful, you’re welcome to share it with someone
        who may need prayer.
      </div>
    </div>
  );
}


