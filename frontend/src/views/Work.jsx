import { useRef, useState } from "react";
import { palette, baseStyles, radius } from "../config/theme";
import { Card, CardHead, Pill, Button, Badge, Icon } from "../components";

const STATUS_TONE = {
  pending: "neutral", processing: "info", ok: "ok", err: "err", cancelled: "warn",
};
const STATUS_LABEL = {
  pending: "PENDING", processing: "PROCESSING", ok: "ENROLLED", err: "FAILED", cancelled: "CANCELLED",
};

function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status}</Badge>;
}

export function Work({
  carrierId, carrierName, code, setCode, onLookup,
  file, preview, imageBase64, onPickFile, onUpload, busy,
  bulkResults, bulkRunning, onBulkUpload, onBulkCancel, onBulkReset,
}) {
  const fileInputRef = useRef();
  const folderInputRef = useRef();
  const currentStep = carrierId ? 2 : 1;

  const [bulkMode, setBulkMode] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [folderError, setFolderError] = useState("");

  const handleFolderPick = (e) => {
    setFolderError("");
    const files = Array.from(e.target.files || []);
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) { setFolderError("No image files found in the selected folder"); return; }
    setPendingFiles(images);
  };
  const handleStartBulk = () => onBulkUpload(pendingFiles);
  const handleNewBatch = () => {
    onBulkReset(); setPendingFiles([]); setFolderError("");
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  const okCount = bulkResults.filter((r) => r.status === "ok").length;
  const errCount = bulkResults.filter((r) => r.status === "err").length;
  const remaining = bulkResults.filter((r) => r.status === "pending" || r.status === "processing").length;
  const progressPct = bulkResults.length ? ((okCount + errCount) / bulkResults.length) * 100 : 0;

  const thStyle = {
    padding: "10px 16px", textAlign: "left", fontSize: 10.5, fontWeight: 700,
    color: palette.dim, textTransform: "uppercase", letterSpacing: ".4px",
    position: "sticky", top: 0, background: palette.surface2, zIndex: 1,
  };

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      {/* Mode toggle */}
      <div style={{
        display: "flex", background: palette.surface, border: `1px solid ${palette.border}`,
        borderRadius: radius.md, padding: 4, marginBottom: 24, boxShadow: palette.shadowSm,
      }}>
        {[
          { key: false, label: "Single Upload", icon: "user", disabled: bulkRunning },
          { key: true, label: "Bulk Upload", icon: "folder", disabled: busy },
        ].map((m) => {
          const active = bulkMode === m.key;
          return (
            <button
              key={String(m.key)} type="button" disabled={m.disabled}
              onClick={() => setBulkMode(m.key)}
              style={{
                flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "10px 16px", borderRadius: radius.sm, border: "none",
                background: active ? "linear-gradient(135deg, var(--primary), var(--primary-strong))" : "transparent",
                color: active ? palette.primaryContrast : palette.muted,
                fontSize: 13.5, fontWeight: 600, cursor: m.disabled ? "not-allowed" : "pointer",
                transition: "all .2s var(--ease)", fontFamily: "var(--font-sans)",
              }}
            >
              <Icon name={m.icon} size={16} /> {m.label}
            </button>
          );
        })}
      </div>

      {/* ── Single upload ── */}
      {!bulkMode && (
        <>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 26 }}>
            <Pill stepNumber={1} text="Lookup Member" active={currentStep === 1} done={currentStep > 1} />
            <div style={{ flex: 1, height: 2, margin: "0 -2px", background: currentStep > 1 ? palette.accent : palette.border, transition: "background .3s" }} />
            <Pill stepNumber={2} text="Upload Face" active={currentStep === 2} done={false} />
          </div>

          <Card glow={currentStep === 1} style={{ marginBottom: 18 }}>
            <CardHead stepNumber={1} done={!!carrierId} title="Look Up Member"
              sub="Enter a membership code to resolve the AEOS Carrier ID" />
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="KODE-0000, Note: KODE is all caps."
                style={{ ...baseStyles.input, flex: 1 }}
                onKeyDown={(e) => e.key === "Enter" && onLookup()}
              />
              <Button onClick={onLookup} disabled={busy || !code.trim()} icon="search" style={{ whiteSpace: "nowrap" }}>Find</Button>
            </div>
            {carrierId && (
              <div style={{
                marginTop: 16, padding: 16, borderRadius: radius.md,
                background: palette.okGlow, border: `1px solid ${palette.okBorder}`,
                animation: "popIn .25s var(--ease)",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: palette.dim, textTransform: "uppercase", letterSpacing: ".5px" }}>AEOS Carrier ID</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: palette.ok, fontFamily: "var(--font-mono)", lineHeight: 1.1 }}>{carrierId}</div>
                </div>
                {carrierName && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: palette.dim }}>Member</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{carrierName}</div>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card glow={currentStep === 2} disabled={!carrierId}>
            <CardHead stepNumber={2} done={false} title="Upload Face Image"
              sub="Auto-converted to Base64, then sent to AEOS & Suprema" />
            {carrierId && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8, padding: "9px 13px", borderRadius: radius.sm,
                background: palette.surface2, border: `1px solid ${palette.border}`, fontSize: 13, marginBottom: 16, color: palette.muted,
              }}>
                Uploading for Carrier ID:
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: palette.accent }}>{carrierId}</span>
                {carrierName && <span style={{ color: palette.dim }}>({carrierName})</span>}
              </div>
            )}

            <div
              role="button" tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${preview ? palette.accentBorder : palette.border}`,
                borderRadius: radius.md, padding: preview ? 14 : 40, textAlign: "center",
                cursor: "pointer", transition: "all .2s var(--ease)",
                background: preview ? "transparent" : palette.surface2,
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg" onChange={onPickFile} style={{ display: "none" }} />
              {preview ? (
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <img src={preview} alt="Selected face preview" style={{ width: 88, height: 88, borderRadius: radius.sm, objectFit: "cover", border: `2px solid ${palette.accentBorder}` }} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{file?.name}</div>
                    <div style={{ fontSize: 12.5, color: palette.dim, marginBottom: 8 }}>{(file?.size / 1024).toFixed(1)} KB — click to change</div>
                    <Badge tone="ok" dot>BASE64 READY</Badge>
                  </div>
                </div>
              ) : (
                <>
                  <span style={{ display: "inline-flex", color: palette.dim, marginBottom: 10 }}><Icon name="upload_cloud" size={34} stroke={1.5} /></span>
                  <div style={{ fontSize: 14, color: palette.muted, marginBottom: 3 }}>Click to select a face photo</div>
                  <div style={{ fontSize: 12.5, color: palette.dim }}>JPG or PNG, max 5 MB</div>
                </>
              )}
            </div>

            <Button onClick={onUpload} disabled={busy || !imageBase64 || !carrierId} icon="scan" full size="lg" style={{ marginTop: 16 }}>
              Enroll Face ID
            </Button>
          </Card>
        </>
      )}

      {/* ── Bulk upload ── */}
      {bulkMode && (
        <div style={{ animation: "fadeUp .3s var(--ease)" }}>
          <Card glow>
            <CardHead stepNumber={1} done={bulkResults.length > 0 && !bulkRunning}
              title="Bulk Face Enrollment"
              sub="Select a folder of face images — each filename should be the membership code" />

            {/* Phase 1: folder picker */}
            {bulkResults.length === 0 && pendingFiles.length === 0 && (
              <>
                <div
                  role="button" tabIndex={0}
                  onClick={() => folderInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && folderInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${palette.border}`, borderRadius: radius.md, padding: 40,
                    textAlign: "center", cursor: "pointer", transition: "all .2s var(--ease)", background: palette.surface2,
                  }}
                >
                  <input ref={folderInputRef} type="file" webkitdirectory="" directory="" multiple onChange={handleFolderPick} style={{ display: "none" }} />
                  <span style={{ display: "inline-flex", color: palette.dim, marginBottom: 10 }}><Icon name="folder" size={34} stroke={1.5} /></span>
                  <div style={{ fontSize: 14, color: palette.muted, marginBottom: 3 }}>Click to select a folder</div>
                  <div style={{ fontSize: 12.5, color: palette.dim }}>Each image filename = membership code (e.g. KODE-44638.jpg)</div>
                </div>
                {folderError && <div style={{ color: palette.err, fontSize: 13, marginTop: 12, textAlign: "center" }}>{folderError}</div>}
              </>
            )}

            {/* Phase 2: preview */}
            {pendingFiles.length > 0 && bulkResults.length === 0 && (
              <div style={{ animation: "fadeUp .25s var(--ease)" }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 15px", borderRadius: radius.sm, background: palette.accentGlow,
                  border: `1px solid ${palette.accentBorder}`, marginBottom: 14,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: palette.accent }}>{pendingFiles.length} image{pendingFiles.length !== 1 ? "s" : ""} found</span>
                  <span style={{ fontSize: 12, color: palette.dim }}>Review then start</span>
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto", border: `1px solid ${palette.border}`, borderRadius: radius.sm, marginBottom: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["#", "Filename", "Membership Code"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {pendingFiles.map((f, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${palette.border}` }}>
                          <td style={{ padding: "8px 16px", fontSize: 12, color: palette.dim }}>{i + 1}</td>
                          <td style={{ padding: "8px 16px", fontSize: 13 }}>{f.name}</td>
                          <td style={{ padding: "8px 16px", fontSize: 13, fontFamily: "var(--font-mono)", color: palette.accent, fontWeight: 500 }}>{f.name.replace(/\.[^.]+$/, "")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Button onClick={handleStartBulk} icon="upload" full>Start Enrollment ({pendingFiles.length})</Button>
                  <Button onClick={handleNewBatch} variant="ghost">Clear</Button>
                </div>
              </div>
            )}

            {/* Phase 3: progress / results */}
            {bulkResults.length > 0 && (
              <div style={{ animation: "fadeUp .25s var(--ease)" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                  <Badge tone="ok" dot>{okCount} enrolled</Badge>
                  <Badge tone="err" dot>{errCount} failed</Badge>
                  {bulkRunning && <Badge tone="info" dot>{remaining} remaining</Badge>}
                </div>
                {bulkRunning && (
                  <div style={{ height: 6, borderRadius: 3, background: palette.surface2, marginBottom: 14, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, var(--primary), var(--accent))", transition: "width .3s ease", width: `${progressPct}%` }} />
                  </div>
                )}
                <div style={{ maxHeight: 340, overflowY: "auto", border: `1px solid ${palette.border}`, borderRadius: radius.sm, marginBottom: 14 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["#", "Code", "Status", "Detail"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {bulkResults.map((r, i) => (
                        <tr key={i} style={{ borderTop: `1px solid ${palette.border}` }}>
                          <td style={{ padding: "8px 16px", fontSize: 12, color: palette.dim }}>{i + 1}</td>
                          <td style={{ padding: "8px 16px", fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 500 }}>{r.code}</td>
                          <td style={{ padding: "8px 16px" }}><StatusBadge status={r.status} /></td>
                          <td style={{ padding: "8px 16px", fontSize: 12.5, color: palette.muted, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.detail}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {bulkRunning ? (
                  <Button onClick={onBulkCancel} variant="danger" full icon="x">Cancel Remaining</Button>
                ) : (
                  <Button onClick={handleNewBatch} full icon="refresh">New Batch</Button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
