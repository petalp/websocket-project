import express from "express";
import { systemConfig } from "./config/sysConfig.ts";
import matchRoute from "./routes/match.route.ts";
import { createServer } from "node:http";
import { attachWebsocketServer } from "./utils/websocket.ts";

const app = express();

const server = createServer(app)

app.use(express.json());
app.use("/matches", matchRoute);

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

const {broadcastMatch} = attachWebsocketServer(server)
app.locals.broadcastMatchCreated = broadcastMatch;

server.listen(systemConfig.PORT, () => {
  console.log(`Server listening at http://localhost:${systemConfig.PORT}`);
});
