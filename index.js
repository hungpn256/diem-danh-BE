//index.js

import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("GeeksforGeeks");
});

const PORT = 1200;

app.listen(PORT, () => {
  console.log(`Running on PORT ${PORT}`);
});
