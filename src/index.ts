import express from "express";
import { systemConfig } from "./config/sysConfig.ts";

const app = express();


app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

app.listen(systemConfig.PORT, () => {
  console.log(`Server listening at http://localhost:${systemConfig.PORT}`);
});
