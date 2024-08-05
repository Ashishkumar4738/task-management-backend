import express from "express";
import cors from "cors";
import db from "./db/db.js";
import login from "./routes/auth.js"
import createtask from "./routes/tasks.js"
const port = process.env.PORT || 5000;
const app = express();

// * middlewares
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: false }));

// * routes
app.use("/auth", login);
app.use("/task", createtask);

app.get("/", (req, res) => {
    res.send("Welcome to updated api");
})

app.listen((port), (req, res) => {
    console.log(`server started at port ${port} `);
})