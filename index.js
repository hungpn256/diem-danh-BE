//index.js

import express from "express";
import cors from "cors";
import { router } from "./src/router/index.js";
import mongoose from "mongoose";
import { keys } from "./src/config/key.js";
import morgan from "morgan";

morgan.token("body", (req, res) => JSON.stringify(req.body));
const app = express();

app.use(
  morgan(
    ":method :url :status :response-time ms - :res[content-length] :body - :req[content-length]"
  )
);

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
