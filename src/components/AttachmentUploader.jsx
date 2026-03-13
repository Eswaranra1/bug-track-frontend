import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { getUploadUrl } from "../utils/uploadUrl";

export default function AttachmentUploader({ bugId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const load = async () => {
    if (!bugId) return;
    setLoading(true);
    try {
      const res = await API.get(`/bugs/${bugId}/attachments`);
      setAttachments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bugId]);

  const uploadFile = useCallback(
    async (file) => {
      if (!file || !bugId) return;
      const formData = new FormData();
      formData.append("file", file);
      setUploading(true);
      try {
        const res = await API.post(`/bugs/${bugId}/attachments`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setAttachments((prev) => [res.data, ...prev]);
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    },
    [bugId]
  );

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) uploadFile(file);
  };

  useEffect(() => {
    if (!bugId) return;
    const handlePaste = (e) => {
      const item = e.clipboardData?.items?.[0];
      if (!item || item.kind !== "file") return;
      const file = item.getAsFile();
      if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
        e.preventDefault();
        uploadFile(file);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [bugId, uploadFile]);

  if (!bugId) return null;

  return (
    <div className="attachment-uploader" style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Attachments</h3>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "var(--primary)" : "var(--border)"}`,
          borderRadius: 12,
          padding: 24,
          textAlign: "center",
          marginBottom: 12,
          background: dragOver ? "var(--primary)" + "12" : "var(--bg-card)",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>Drop screenshot here</p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>or paste (Ctrl+V) · or pick a file below</p>
      </div>
      <label className="btn btn-ghost btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 12 }}>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFile}
          disabled={uploading}
          style={{ display: "none" }}
        />
        {uploading ? "Uploading…" : "📎 Add screenshot or file"}
      </label>
      {loading ? (
        <div style={{ color: "var(--text-muted)" }}>Loading…</div>
      ) : attachments.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No attachments yet.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {attachments.map((a) => {
            const url = getUploadUrl(a.fileUrl);
            const isImage = /\.(jpe?g|png|gif|webp)$/i.test(a.originalName || a.fileUrl);
            return (
              <div
                key={a._id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  overflow: "hidden",
                  maxWidth: 200,
                }}
              >
                {isImage ? (
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={a.originalName || "Attachment"} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                  </a>
                ) : null}
                <div style={{ padding: "6px 8px", fontSize: 12 }}>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", wordBreak: "break-all" }}>
                    {a.originalName || "File"}
                  </a>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{a.uploadedBy?.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
