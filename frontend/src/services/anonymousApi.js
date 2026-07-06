// frontend/src/services/anonymousApi.js
import api from "./api"; // your existing axios instance (baseURL already set to backend)

export const validateInvite = (code) => api.get(`/anonymous/invite/${code}`);

export const joinInvite = (code, nickname) =>
  api.post(`/anonymous/invite/${code}/join`, { nickname });

export const createInvite = () => api.post("/anonymous/invite"); // host-
// side, needs auth header (existing api instance already attaches Firebase token)
export const reportRoom = (roomId, reporterNickname, reason) =>
  api.post(`/anonymous/room/${roomId}/report`, { reporterNickname, reason });