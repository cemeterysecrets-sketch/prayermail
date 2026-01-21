import { useEffect } from "react";
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

const firebaseConfig = {
  apiKey: "AIzaSyCh9PCMPbe0jjBdwSgQ-rcFynNcVZ9xcUo",
  authDomain: "prayermail-9249a.firebaseapp.com",
  projectId: "prayermail-9249a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function AnswerPrayer() {
  const [params] = useSearchParams();
  const token = params.get("token");

  useEffect(() => {
    async function run() {
      const q = query(
        collection(db, "prayers"),
        where("editToken", "==", token)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { answered: true });
      }
    }
    if (token) run();
  }, [token]);

  return <p style={{ textAlign: "center" }}>
    🙏 This prayer has been marked as answered.
  </p>;
}

