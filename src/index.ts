import express from "express";

const app = express();
const PORT = 8080;

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
