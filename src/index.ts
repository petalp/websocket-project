import express from "express";
import { systemConfig } from "./config/sysConfig.ts";
import matchRoute from "./routes/match.route.ts";
import commentaryRoute from "./routes/commentary.route.ts";
import { createServer } from "node:http";
import { attachWebsocketServer } from "./utils/websocket.ts";
import arcjetMiddleware from "./middleware/arcjetMiddleware.ts";

const app = express();

const server = createServer(app)

app.use(express.json());
app.use(arcjetMiddleware)
app.use("/matches", matchRoute);
app.use("/commentary", commentaryRoute);

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

const {broadcastMatch, broadcastMatchCommentary} = attachWebsocketServer(server)
app.locals.broadcastMatchCreated = broadcastMatch;
app.locals.broadcastMatchCommentary = broadcastMatchCommentary;

server.listen(systemConfig.PORT, () => {
  console.log(`Server listening at http://localhost:${systemConfig.PORT}`);
});
