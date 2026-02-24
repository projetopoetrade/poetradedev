// Fallback 404 — rendered outside the [locale] layout (no theme/header available).
// Most 404s are caught by app/[locale]/not-found.tsx which has the full site design.
export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#09090b", color: "#fafafa", fontFamily: "sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: "16px", textAlign: "center", padding: "0 16px" }}>
        <p style={{ fontSize: "96px", fontWeight: 700, opacity: 0.08, lineHeight: 1, margin: 0 }}>404</p>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Page not found</h1>
        <p style={{ color: "#a1a1aa", margin: 0, maxWidth: "360px" }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <a href="/" style={{ marginTop: "8px", color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
          &larr; Back to Home
        </a>
      </body>
    </html>
  );
}
