"use client";

// Root error boundary. Catches errors thrown in the root layout / anywhere the
// nested error boundaries don't. Must render its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Prompt, system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#2e5aac",
              marginBottom: 8,
            }}
          >
            ขออภัย
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            เกิดข้อผิดพลาดบางอย่าง
          </h1>
          <p style={{ color: "#475569", margin: "0 0 24px", lineHeight: 1.6 }}>
            ระบบพบปัญหาที่ไม่คาดคิด ทีมงานได้รับการแจ้งเตือนแล้ว
            กรุณาลองใหม่อีกครั้ง
          </p>
          <div
            style={{ display: "flex", gap: 12, justifyContent: "center" }}
          >
            <button
              onClick={() => reset()}
              style={{
                background: "#2e5aac",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ลองใหม่
            </button>
            <a
              href="/"
              style={{
                background: "#fff",
                color: "#2e5aac",
                border: "1px solid #c7d6f0",
                borderRadius: 10,
                padding: "10px 20px",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              กลับหน้าแรก
            </a>
          </div>
          {error?.digest && (
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 20 }}>
              รหัสอ้างอิง: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
