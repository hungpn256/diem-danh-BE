//index.js

import express from "express";
import cors from "cors";
import { router } from "./src/router/index.js";
import mongoose from "mongoose";
import { keys } from "./src/config/key.js";

const app = express();
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("GeeksforGeeks");
});

mongoose
  .connect(keys.database.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log(`MongoDB Connected!`);
  })
  .catch((err) => console.log(err));

app.use("/api", router);

const PORT = 1200;

app.listen(PORT, () => {
  console.log(`Running on PORT ${PORT}`);
});
