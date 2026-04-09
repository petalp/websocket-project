import express from "express";
import { systemConfig } from "./config/sysConfig.ts";
import matchRoute from "./routes/match.route.ts";

const app = express();

app.use(express.json());
app.use("/matches", matchRoute);

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

app.listen(systemConfig.PORT, () => {
  console.log(`Server listening at http://localhost:${systemConfig.PORT}`);
});
