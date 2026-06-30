import { io } from "socket.io-client";

let socket = null;

export const initSocket = async (getToken) => {
  const token = await getToken();
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};