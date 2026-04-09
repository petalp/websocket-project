import type { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

export function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

export function broadcast(wss: WebSocketServer, payload: unknown) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebsocketServer(server: Server) {
// connecting the websocket server with express 
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (ws:WebSocket)=>{
    sendJson(ws, {type:"welcome"})
  })

  function broadcastMatch(match:unknown){
    broadcast(wss, {type:"match_create", data:match})
  }
  return {broadcastMatch}
}
