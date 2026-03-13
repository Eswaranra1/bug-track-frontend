import API from "./api";

export async function getTeams() {
  const res = await API.get("/teams");
  return res.data;
}

export async function getTeamById(id) {
  const res = await API.get(`/teams/${id}`);
  return res.data;
}

export async function getTeamMembers(teamId) {
  const res = await API.get(`/teams/${teamId}/members`);
  return res.data;
}

export async function createTeam(data) {
  const res = await API.post("/teams", data);
  return res.data;
}

export async function updateTeam(id, data) {
  const res = await API.put(`/teams/${id}`, data);
  return res.data;
}

export async function deleteTeam(id) {
  await API.delete(`/teams/${id}`);
}

/** Add or update member. Pass either userId or email, and role. */
export async function addTeamMember(teamId, { userId, email, role }) {
  const res = await API.post(`/teams/${teamId}/members`, { userId, email, role });
  return res.data;
}

export async function removeTeamMember(teamId, userId) {
  const res = await API.delete(`/teams/${teamId}/members/${userId}`);
  return res.data;
}
