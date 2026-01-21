import { useEffect } from "react";

export default function PrayerApp() {
  useEffect(() => {
    console.log("PrayerApp mounted successfully");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 40,
        fontFamily: "Arial, sans-serif",
        background: "#f8fafc",
      }}
    >
      <h1 style={{ color: "#5f7d8c" }}>PrayerMail</h1>
      <p>
        If you can see this message, React is rendering correctly on Vercel.
      </p>
      <p style={{ marginTop: 20, color: "#6b7280" }}>
        This is a temporary sanity check.
      </p>
    </div>
  );
}

