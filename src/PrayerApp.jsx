import { useEffect, useRef, useState } from "react";
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

/* 🔑 Ownership helpers */
function getOwnership() {
  return JSON.parse(localStorage.getItem("myPrayerTokens") || "{}");
}

function saveOwnership(prayerId, token) {
  const owned = getOwnership();
  owned[prayerId] = token;
  localStorage.setItem("myPrayerTokens", JSON.stringify(owned));
}

function ownsPrayer(prayerId, token) {
  const owned = getOwnership();
  return owned[prayerId] === token;
}

export default function PrayerApp() {
  const [prayers, setPrayers] = useState([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [musicOn, setMusicOn] = useState(
    localStorage.getItem("musicOn") === "true"
  );

  const audioRef = useRef(null);

  /* 🎶 Music control */
  useEffect(() => {
    if (!audioRef.current) return;
    if (musicOn) {
      audioRef.current.volume = 0.35;
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
    localStorage.setItem("musicOn", musicOn);
  }, [musicOn]);

  /* 🔄 Live prayers */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "prayers"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPrayers(data.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsub();
  }, []);

  /* 🔗 Handle private edit link */
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

  /* ➕ Submit prayer */
  async function submitPrayer() {
    if (!text.trim()) return;

    const editToken = crypto.randomUUID();

    const ref = await addDoc(collection(db, "prayers"), {
      title: title || "Prayer Request",
      text,
      prayedCount: 0,
      answered: false,
      editToken,
      createdAt: Date.now(),
    });

    saveOwnership(ref.id, editToken);

    setTitle("");
    setText("");
  }

  async function pray(id) {
    await updateDoc(doc(db, "prayers", id), {
      prayedCount: increment(1),
    });
  }

  async function saveEdit(id) {
    await updateDoc(doc(db, "prayers", id), { text: editText });
    setEditingId(null);
    setEditText("");
  }

  async function markAnswered(id) {
    await updateDoc(doc(db, "prayers", id), { answered: true });
  }

  async function removePrayer(id) {
    if (!confirm("Delete this prayer?")) return;
    await deleteDoc(doc(db, "prayers", id));
  }

  function copyLink(token) {
    navigator.clipboard.writeText(
      `${window.location.origin}/?edit=${token}`
    );
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
    return `${Math.floor(s / 86400)} days ago`;
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
      {/* 🎵 Harp Audio */}
      <audio ref={audioRef} src="/harp.mp3" loop />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <h1
          style={{
            color: "#5f7d78",
            fontWeight: "normal",
            marginBottom: 4,
          }}
        >
          PrayerMail
        </h1>

        <div
          style={{
            fontStyle: "italic",
            color: "#7a7a7a",
            marginBottom: 8,
          }}
        >
          “Pray for one another, that you may be healed.”<br />
          <span style={{ fontSize: 13 }}>— James 5:16</span>
        </div>

        <button
          onClick={() => setMusicOn(!musicOn)}
          style={{
            fontSize: 13,
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid #ddd",
            background: "#f4f7f6",
            cursor: "pointer",
          }}
        >
          🎵 Gentle music: {musicOn ? "On" : "Off"}
        </button>
      </div>

      {/* Form */}
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
        rows={4}
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

      {/* Prayers */}
      {prayers.map((p) => {
        const isOwner = ownsPrayer(p.id, p.editToken);

        return (
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
            <div style={{ fontSize: 13, color: "#888" }}>
              {timeAgo(p.createdAt)}
            </div>

            {editingId === p.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  style={{ width: "100%", marginTop: 8 }}
                />
                <button onClick={() => saveEdit(p.id)}>Save</button>
              </>
            ) : (
              <div style={{ margin: "10px 0" }}>{p.text}</div>
            )}

            {p.answered && (
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#e7f2ee",
                  color: "#3f6f64",
                  fontSize: 13,
                  marginBottom: 8,
                }}
              >
                🙏 Prayer Answered
              </div>
            )}

            <div>
              <button
                onClick={() => pray(p.id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #ddd",
                  background: "#f4f7f6",
                  marginRight: 6,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                🙏 {p.prayedCount} I’ll Pray
              </button>

              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setEditText(p.text);
                    }}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #ddd",
                      background: "#f4f7f6",
                      marginRight: 6,
                      cursor: "pointer",
                      fontSize: 13,
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
                        fontSize: 13,
                      }}
                    >
                      🙌 Answered
                    </button>
                  )}

                  <button
                    onClick={() => copyLink(p.editToken)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #ddd",
                      background: "#f4f7f6",
                      marginRight: 6,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    📋 Copy Link
                  </button>

                  <button
                    onClick={() => removePrayer(p.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #f0c2c2",
                      background: "#fdeaea",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
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


