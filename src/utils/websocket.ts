import type { IncomingMessage, Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { aj } from "../config/arcjet.ts";

interface IWebSocket extends WebSocket {
  isAlive: boolean;
  subscriptions:Set<number>
}
const matchSubscribers = new Map()

function subscribe(matchId:number, socket:IWebSocket){
  if(!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set())
  }
  matchSubscribers.get(matchId).add(socket)
}

function unsubscribe(matchId:number, socket:IWebSocket){
  const getMatch = matchSubscribers.get(matchId)
  if(!getMatch) return;
    getMatch.delete(socket)
  if(matchSubscribers.size ===  0){
    matchSubscribers.delete(matchId)
  }
}

function cleanupSubscription(socket:IWebSocket){
  for(const matchId of socket.subscriptions){
    unsubscribe(matchId, socket)
  }
}

function broadcastToMatch(matchId:number, payload:unknown){
  const subscribe = matchSubscribers.get(matchId)
  if(!subscribe || subscribe.size === 0) return;

  const message = JSON.stringify(payload)

  for(const client of subscribe){
    if(client.readyState !== WebSocket.OPEN) continue;
    client.send(message)
  }
}

function handleMessage(socket:IWebSocket, data:any){
  let message;
  try{
    message = JSON.parse(data.toString())
  }catch{
    sendJson(socket, {type:"subscribe", matchId:message.matchId})
  }

  if(message?.type === "subscribe" && Number.isInteger(message.matchId)){
    subscribe(message.matchId, socket)
    socket.subscriptions.add(message.matchId)
    sendJson(socket, {type:"subscribed", matchId:message.matchId})
  }

  if(message?.type === "unsubscribe" && Number.isInteger(message.matchId)){
    unsubscribe(message.matchId, socket)
    socket.subscriptions.delete(message.matchId)
    sendJson(socket, {type:"unsubscribed", matchId:message.matchId})
  }

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

  wss.on("connection", async (raWs: WebSocket, req: IncomingMessage) => {
    const ws = raWs as IWebSocket;
    try {
      const decision = await aj.protect(req, { requested: 10 });
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          ws.close(1008, "Rate limit exceeded");
          return;
        }
        if (decision.reason.isBot()) {
          ws.close(1013, "Access denied");
          return;
        }
        ws.close(1008, "Access denied");
        return;
      }
    } catch (e) {
      console.error("WS connection error");
      ws.close(1011, "server security error");
      return;
    }

    ws.isAlive = true;

    ws.subscriptions = new Set()

    ws.on("message", (data)=>{
      handleMessage(ws, data)
    })

    ws.on("error", ()=>{
      ws.terminate()
    })

    ws.on("close", ()=>{
      cleanupSubscription(ws)
    })

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

  function broadcastMatchCommentary(matchId:number, comment:any){
    broadcastToMatch(matchId, {type:"commentary", data:comment})
  }
  return { broadcastMatch, broadcastMatchCommentary };
}
