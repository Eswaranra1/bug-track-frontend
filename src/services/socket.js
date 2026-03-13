let socket = null;

export function connectSocket(url) {
  if (!url || typeof WebSocket === "undefined") return null;
  if (socket) return socket;

  try {
    socket = new WebSocket(url);
  } catch {
    socket = null;
  }
  return socket;
}

export function subscribeToEvents({ onBugCreated, onBugUpdated, onCommentAdded } = {}) {
  if (!socket) return;
  socket.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (!payload || !payload.type) return;
      if (payload.type === "bug_created" && onBugCreated) onBugCreated(payload.data);
      if (payload.type === "bug_updated" && onBugUpdated) onBugUpdated(payload.data);
      if (payload.type === "comment_added" && onCommentAdded) onCommentAdded(payload.data);
    } catch {
      // ignore malformed events
    }
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

