import { useState, useCallback, useEffect, useRef } from "react";
import { injectFonts } from "./utils/fonts";
import { MAX_IMAGE_SIZE_BYTES } from "./config/constants";
import { PERM, can } from "./config/permissions";
import { loginToApi, findOwner, addOwnerImage, SessionExpiredError } from "./services/api";
import { portalApi, tokenStore, PortalAuthError } from "./services/portalApi";
import { Toast, LoadingOverlay, AppShell } from "./components";
import { Login, Work, Admin, Dashboard } from "./views";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

// Maps human action labels used in the UI to the backend's audit action codes.
const ACTION_CODE = { Lookup: "lookup", Upload: "upload", "Bulk Upload": "bulk_upload" };

// Nav definition — filtered by the signed-in user's permissions.
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "grid", perm: PERM.DASHBOARD_VIEW },
  { key: "work", label: "Enrollment", icon: "scan", perm: PERM.MEMBERS_ENROLL },
  { key: "users", label: "Users & Roles", icon: "users", perm: PERM.USERS_MANAGE },
];

export default function App() {
  useEffect(() => { injectFonts(); }, []);

  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);          // AEOS bearer token (unchanged flow)
  const [view, setView] = useState("login");
  const [bootstrapping, setBootstrapping] = useState(true);

  // keep a ref in sync so long-running loops (bulk upload) always read the latest token
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const [membershipCode, setMembershipCode] = useState("");
  const [carrierId, setCarrierId] = useState(null);
  const [carrierName, setCarrierName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [bulkResults, setBulkResults] = useState([]);
  const [bulkRunning, setBulkRunning] = useState(false);
  const bulkCancelRef = useRef(false);

  const showToast = useCallback((message, type = "info") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // Audit logging now persists to the backend (replaces in-memory per-user logs).
  // Fire-and-forget — never blocks or breaks the AEOS enrollment flow.
  const logRequest = useCallback((action, status, detail = "", extra = {}) => {
    portalApi.recordLog({
      action: ACTION_CODE[action] ?? "info",
      status,
      detail,
      targetCode: extra.targetCode ?? null,
      carrierId: extra.carrierId ?? null,
    });
  }, []);

  const resetState = useCallback(() => {
    portalApi.logout();
    setCurrentUser(null);
    setToken(null);
    setView("login");
    setMembershipCode("");
    setCarrierId(null);
    setCarrierName("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageBase64(null);
    setBulkResults([]);
    setBulkRunning(false);
    bulkCancelRef.current = false;
  }, []);

  const forceLogout = useCallback(
    (reason) => {
      resetState();
      showToast(reason || "Session expired — please sign in again", "err");
    },
    [resetState, showToast]
  );

  const landingView = useCallback(
    (user) => (can(user, PERM.DASHBOARD_VIEW) ? "dashboard" : "work"),
    []
  );

  // Restore a previous portal session on load (if a valid JWT is stored),
  // then re-establish the AEOS token exactly as a fresh login would.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!tokenStore.get()) { setBootstrapping(false); return; }
      try {
        const user = await portalApi.me();
        if (!active) return;
        try {
          const auth = await loginToApi();
          if (active) setToken(auth.token);
        } catch { /* AEOS may be unreachable; next call surfaces it */ }
        setCurrentUser(user);
        setView(landingView(user));
      } catch {
        portalApi.logout();
      } finally {
        if (active) setBootstrapping(false);
      }
    })();
    return () => { active = false; };
  }, [landingView]);

  // silently re-authenticate the AEOS token every 12 min (15-min expiry) — unchanged
  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      try {
        const auth = await loginToApi();
        setToken(auth.token);
      } catch { /* next API call will trigger 401 handling */ }
    }, 12 * 60 * 1000);
    return () => clearInterval(id);
  }, [token]);

  // prevent accessing protected views without being logged in
  useEffect(() => {
    if (view !== "login" && !currentUser) setView("login");
  }, [view, currentUser]);

  const handleLogin = async (username, password) => {
    setBusy(true);
    try {
      // 1) Validate portal credentials against the backend (bcrypt + JWT).
      const user = await portalApi.login(username, password);
      // 2) Establish the AEOS bearer token exactly as before.
      try {
        const auth = await loginToApi();
        setToken(auth.token);
      } catch (aeosErr) {
        // Portal auth succeeded but AEOS is unreachable — allow entry with a warning.
        showToast(`Signed in, but AEOS is unreachable: ${aeosErr.message || "no connection"}`, "warn");
      }
      setCurrentUser(user);
      setView(landingView(user));
      showToast(`Welcome, ${user.fullName}`, "ok");
    } catch (err) {
      if (err instanceof PortalAuthError) showToast("Invalid username or password", "err");
      else showToast(`Login failed: ${err.message || "Could not reach the portal server"}`, "err");
    }
    setBusy(false);
  };

  const handleLookup = async () => {
    if (!membershipCode.trim()) {
      showToast("Enter a membership code first", "err");
      return;
    }
    setBusy(true);
    setCarrierId(null);
    setCarrierName("");
    try {
      const owner = await findOwner(membershipCode.trim(), tokenRef.current);
      setCarrierId(owner.id);
      setCarrierName(`${owner.firstName} ${owner.lastName}`.trim());
      logRequest("Lookup", "ok", `${membershipCode} → ID ${owner.id}`, { targetCode: membershipCode.trim(), carrierId: owner.id });
      showToast(`Carrier ID: ${owner.id}`, "ok");
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        forceLogout(err.message);
      } else {
        logRequest("Lookup", "err", `${membershipCode} — ${err.message}`, { targetCode: membershipCode.trim() });
        showToast(`Lookup failed: ${err.message}`, "err");
      }
    }
    setBusy(false);
  };

  const handlePickFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Select an image (JPG/PNG)", "err");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast("Max 5 MB", "err");
      return;
    }
    setSelectedFile(file);

    // readAsDataURL gives us "data:image/jpeg;base64,/9j/4AAQ..."
    // we keep the full thing for the <img> preview and strip the prefix for the API
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreviewUrl(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.onerror = () => {
      showToast("Could not read the file — try again", "err");
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageBase64(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!carrierId) {
      showToast("Look up the Carrier ID first", "err");
      return;
    }
    if (!imageBase64) {
      showToast("Select an image", "err");
      return;
    }
    setBusy(true);
    try {
      await addOwnerImage(carrierId, imageBase64, tokenRef.current);
      logRequest("Upload", "ok", `${membershipCode.trim()} → ID ${carrierId} — Suprema synced`, {
        targetCode: membershipCode.trim(),
        carrierId,
      });
      showToast("Face ID enrolled! Suprema profile linked.", "ok");
      setMembershipCode("");
      setCarrierId(null);
      setCarrierName("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageBase64(null);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        forceLogout(err.message);
      } else {
        logRequest("Upload", "err", `${membershipCode.trim()} — ID ${carrierId} — ${err.message}`, {
          targetCode: membershipCode.trim(),
          carrierId,
        });
        showToast(`Upload failed: ${err.message}`, "err");
      }
    }
    setBusy(false);
  };

  const handleBulkUpload = async (files) => {
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      showToast("No image files found in the selected folder", "err");
      return;
    }

    const results = imageFiles.map((f) => ({
      filename: f.name,
      code: f.name.replace(/\.[^.]+$/, ""),
      status: "pending",
      detail: "",
    }));
    setBulkResults(results);
    setBulkRunning(true);
    bulkCancelRef.current = false;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < imageFiles.length; i++) {
      if (bulkCancelRef.current) {
        setBulkResults((prev) =>
          prev.map((r, j) => (j >= i ? { ...r, status: "cancelled", detail: "Cancelled" } : r))
        );
        break;
      }

      const file = imageFiles[i];
      const code = file.name.replace(/\.[^.]+$/, "");

      setBulkResults((prev) =>
        prev.map((r, j) => (j === i ? { ...r, status: "processing" } : r))
      );

      try {
        if (file.size > MAX_IMAGE_SIZE_BYTES) throw new Error("File exceeds 5 MB limit");

        const base64 = await readFileAsBase64(file);
        const owner = await findOwner(code, tokenRef.current);
        await addOwnerImage(owner.id, base64, tokenRef.current);

        logRequest("Bulk Upload", "ok", `${code} → ID ${owner.id}`, { targetCode: code, carrierId: owner.id });
        setBulkResults((prev) =>
          prev.map((r, j) =>
            j === i ? { ...r, status: "ok", detail: `Carrier ${owner.id} enrolled` } : r
          )
        );
        successCount++;
      } catch (err) {
        if (err instanceof SessionExpiredError) {
          setBulkResults((prev) =>
            prev.map((r, j) => {
              if (j === i) return { ...r, status: "err", detail: "Session expired" };
              if (j > i) return { ...r, status: "cancelled", detail: "Session expired" };
              return r;
            })
          );
          setBulkRunning(false);
          forceLogout(err.message);
          return;
        }
        logRequest("Bulk Upload", "err", `${code} — ${err.message}`, { targetCode: code });
        setBulkResults((prev) =>
          prev.map((r, j) => (j === i ? { ...r, status: "err", detail: err.message } : r))
        );
        failCount++;
      }
    }

    setBulkRunning(false);
    if (!bulkCancelRef.current) {
      showToast(
        `Bulk complete: ${successCount} enrolled, ${failCount} failed`,
        successCount > 0 ? "ok" : "err"
      );
    } else {
      showToast("Bulk upload cancelled", "info");
    }
  };

  const handleBulkCancel = useCallback(() => {
    bulkCancelRef.current = true;
  }, []);

  const handleBulkReset = useCallback(() => {
    setBulkResults([]);
    setBulkRunning(false);
    bulkCancelRef.current = false;
  }, []);

  // ── Render ──
  if (bootstrapping) {
    return <LoadingOverlay label="Restoring session…" />;
  }

  if (view === "login" || !currentUser) {
    return (
      <>
        {toast && <Toast message={toast.message} type={toast.type} />}
        <Login onLogin={handleLogin} busy={busy} />
      </>
    );
  }

  const nav = NAV.filter((item) => can(currentUser, item.perm));
  const titles = {
    dashboard: { title: "Dashboard", subtitle: "Enrollment activity & system monitoring" },
    work: { title: "Face Enrollment", subtitle: "Look up a member and enroll their Face ID" },
    users: { title: "Users & Roles", subtitle: "Manage portal access and review audit logs" },
  };
  const meta = titles[view] ?? titles.work;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <AppShell
        user={currentUser}
        nav={nav}
        current={view}
        onNavigate={setView}
        onLogout={resetState}
        title={meta.title}
        subtitle={meta.subtitle}
      >
        {view === "dashboard" && can(currentUser, PERM.DASHBOARD_VIEW) && (
          <Dashboard onFlash={showToast} onSessionExpired={forceLogout} />
        )}

        {view === "work" && (
          <Work
            user={currentUser}
            carrierId={carrierId}
            carrierName={carrierName}
            code={membershipCode}
            setCode={setMembershipCode}
            onLookup={handleLookup}
            file={selectedFile}
            preview={previewUrl}
            imageBase64={imageBase64}
            onPickFile={handlePickFile}
            onUpload={handleUpload}
            busy={busy}
            bulkResults={bulkResults}
            bulkRunning={bulkRunning}
            onBulkUpload={handleBulkUpload}
            onBulkCancel={handleBulkCancel}
            onBulkReset={handleBulkReset}
          />
        )}

        {view === "users" && can(currentUser, PERM.USERS_MANAGE) && (
          <Admin currentUser={currentUser} onFlash={showToast} onSessionExpired={forceLogout} />
        )}
      </AppShell>
    </>
  );
}
