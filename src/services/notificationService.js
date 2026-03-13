import API from "./api";

export async function getNotifications() {
  const res = await API.get("/notifications");
  return res.data;
}

export async function markNotificationRead(id) {
  const res = await API.put(`/notifications/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead() {
  await API.put("/notifications/read-all");
}
