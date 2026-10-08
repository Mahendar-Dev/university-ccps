// socket.js
// The socket requires the session token (same one as the REST API) so the
// server can put each connection in the right RBAC room (see backend/server.js).
import { io } from "socket.io-client";

let socketInstance = null;

export function connectSocket(token) {
  if (socketInstance) socketInstance.disconnect();
  socketInstance = io({
    autoConnect: true,
    transports: ["websocket", "polling"],
    auth: { token },
  });
  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function getSocket() {
  return socketInstance;
}
