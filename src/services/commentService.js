import API from "./api";

export async function getComments(bugId) {
  const res = await API.get(`/bugs/${bugId}/comments`);
  return res.data;
}

export async function addComment(bugId, message, options = {}) {
  const { parentId, mentionedUserIds } = options;
  const res = await API.post(`/bugs/${bugId}/comments`, {
    message,
    ...(parentId ? { parentId } : {}),
    ...(Array.isArray(mentionedUserIds) ? { mentionedUserIds } : {}),
  });
  return res.data;
}

export async function deleteComment(commentId) {
  await API.delete(`/comments/${commentId}`);
}

export async function toggleReaction(commentId, emoji) {
  const res = await API.post(`/comments/${commentId}/reactions`, { emoji });
  return res.data;
}
