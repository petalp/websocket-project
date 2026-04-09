import type { IncomingMessage, Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { aj } from "../config/arcjet.ts";

interface IWebSocket extends WebSocket {
  isAlive: boolean;
}

export function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(payload));
}

export function broadcast(wss: WebSocketServer, payload: unknown) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(message);
  }
}

export function attachWebsocketServer(server: Server) {
  // connecting the websocket server with express
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", async(raWs: WebSocket, req:IncomingMessage) => {
     const ws = raWs as IWebSocket;
    try{
        const decision = await aj.protect(req, {requested:10})
        if(decision.isDenied()){
            if(decision.reason.isRateLimit()){
                const code =  1008
                const reason = "Rate limit exceed"
            ws.close(code, reason)
            return;
            }
            if(decision.reason.isBot()){
                const code =  1013
                const reason = "Access Denied"
                ws.close(code, reason)
            return;
            }
            
        }

    }catch(e){
        console.error("WS connection error")
        ws.close(1011, "server security error")
        return;
    }
   
    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });
    sendJson(ws, { type: "welcome" });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((rawWs) => {
      const ws = rawWs as IWebSocket;
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 3000);

  wss.on("close", () => clearInterval(interval));

  function broadcastMatch(match: unknown) {
    broadcast(wss, { type: "match_create", data: match });
  }
  return { broadcastMatch };
}
