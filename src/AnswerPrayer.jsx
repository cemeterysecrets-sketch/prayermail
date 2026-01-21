import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

// Firebase config (same as PrayerApp)
const firebaseConfig = {
  apiKey: "AIzaSyCh9PCMPbe0jjBdwSgQ-rcFynNcVZ9xcUo",
  authDomain: "prayermail-9249a.firebaseapp.com",
  projectId: "prayermail-9249a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function AnswerPrayer() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function markAnswered() {
      if (!token) {
        setStatus("invalid");
        return;
      }

      const q = query(
        collection(db, "prayers"),
        where("editToken", "==", token)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setStatus("invalid");
        return;
      }

      const docRef = snap.docs[0].ref;

      await updateDoc(docRef, { answered: true });

      setStatus("done");
    }

    markAnswered();
  }, [token]);

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      {status === "loading" && <p>Marking prayer as answered…</p>}
      {status === "done" && (
        <p>🙏 This prayer has been marked as answered. Thank you!</p>
      )}
      {status === "invalid" && (
        <p>This link is invalid or has already been used.</p>
      )}
    </div>
  );
}
