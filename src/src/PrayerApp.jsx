import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";

// <-- PASTE YOUR FIREBASE CONFIG HERE -->
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
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">PrayerWall</h1>

      <Card>
        <CardContent className="space-y-2 p-4">
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Share your prayer request…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button onClick={submitPrayer} className="w-full">
            Submit Prayer
          </Button>
        </CardContent>
      </Card>

      {prayers.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4 space-y-2">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-sm">{p.text}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">🙏 {p.prayedCount} praying</span>
              <Button size="sm" onClick={() => prayFor(p.id)}>
                I’ll Pray
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
