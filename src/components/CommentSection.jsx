import { useState, useEffect } from "react";
import * as commentService from "../services/commentService";

const REACTION_EMOJIS = ["👍", "❤️", "🚀"];

function CommentItem({ c, currentUserId, onReply, onDelete, onReaction, load }) {
  const [reacting, setReacting] = useState(false);
  const handleReaction = async (emoji) => {
    setReacting(true);
    try {
      await commentService.toggleReaction(c._id, emoji);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setReacting(false);
    }
  };
  const reactions = (c.reactions || []).reduce((acc, r) => {
    const e = r.emoji || "";
    if (!acc[e]) acc[e] = [];
    acc[e].push(r.userId?._id || r.userId);
    return acc;
  }, {});
  const isMyReaction = (emoji) => {
    const userId = currentUserId?.toString?.() || currentUserId;
    return (reactions[emoji] || []).some((id) => (id?._id || id)?.toString() === userId);
  };

  return (
    <li
      style={{
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontSize: 13 }}>{c.user?.name || "Unknown"}</strong>
        <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
          {new Date(c.createdAt).toLocaleString()}
        </span>
        <div style={{ marginTop: 4, fontSize: 14, whiteSpace: "pre-wrap" }}>{c.message}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 12 }}
            onClick={() => onReply(c._id)}
          >
            Reply
          </button>
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={reacting}
              onClick={() => handleReaction(emoji)}
              style={{
                fontSize: 14,
                padding: "2px 6px",
                opacity: isMyReaction(emoji) ? 1 : 0.7,
                background: isMyReaction(emoji) ? "var(--primary)" : undefined,
                color: isMyReaction(emoji) ? "#fff" : undefined,
                borderRadius: 6,
              }}
              title={emoji}
            >
              {emoji}
              {reactions[emoji]?.length > 0 && (
                <span style={{ marginLeft: 4, fontSize: 11 }}>{reactions[emoji].length}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {currentUserId && (c.user?._id?.toString() || c.user?.toString()) === (currentUserId?.toString?.() || currentUserId) && (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => onDelete(c._id)}
          style={{ fontSize: 11, color: "var(--red)" }}
        >
          Delete
        </button>
      )}
    </li>
  );
}

export default function CommentSection({ bugId, currentUserId }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!bugId) return;
    setLoading(true);
    try {
      const data = await commentService.getComments(bugId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [bugId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || !bugId) return;
    setSubmitting(true);
    try {
      await commentService.addComment(bugId, message.trim(), {
        parentId: replyToId || undefined,
      });
      setMessage("");
      setReplyToId(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error(err);
    }
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const byParent = comments.reduce((acc, c) => {
    const pid = (c.parentId?._id || c.parentId)?.toString() || "";
    if (!pid) return acc;
    if (!acc[pid]) acc[pid] = [];
    acc[pid].push(c);
    return acc;
  }, {});

  if (!bugId) return null;

  return (
    <div className="comment-section" style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 12 }}>Comments</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        {replyToId && (
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
            Replying to comment — <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReplyToId(null)}>Cancel</button>
          </div>
        )}
        <textarea
          className="form-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a comment… (use @name to mention)"
          rows={3}
          style={{ width: "100%", resize: "vertical" }}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={submitting || !message.trim()}
          style={{ marginTop: 8 }}
        >
          {submitting ? "Posting…" : "Post comment"}
        </button>
      </form>
      {loading ? (
        <div style={{ color: "var(--text-muted)" }}>Loading comments…</div>
      ) : comments.length === 0 ? (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No comments yet.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {topLevel.map((c) => (
            <div key={c._id}>
              <CommentItem
                c={c}
                currentUserId={currentUserId}
                onReply={setReplyToId}
                onDelete={handleDelete}
                onReaction={() => {}}
                load={load}
              />
              {(byParent[c._id] || []).map((reply) => (
                <li
                  key={reply._id}
                  style={{
                    padding: "10px 0 10px 24px",
                    borderBottom: "1px solid var(--border)",
                    borderLeft: "2px solid var(--border)",
                    marginLeft: 12,
                  }}
                >
                  <CommentItem
                    c={reply}
                    currentUserId={currentUserId}
                    onReply={setReplyToId}
                    onDelete={handleDelete}
                    onReaction={() => {}}
                    load={load}
                  />
                </li>
              ))}
            </div>
          ))}
        </ul>
      )}
    </div>
  );
}
