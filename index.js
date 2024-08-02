import express from "express";
import cors from "cors";
import db from "./db/db.js";
import login from "./routes/auth.js"
import createtask from "./routes/tasks.js"
const app = express();

// * middlewares
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({extended:false}));

// * routes
app.use("/auth",login);
app.use("/task",createtask);

app.get("/",(req,res)=>{
    res.send("Welcome to api");
})

app.listen((5000),(req,res)=>{
    console.log("server started at port 5000");
})