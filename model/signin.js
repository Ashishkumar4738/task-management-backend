import { Schema, model } from "mongoose";
import TaskModel from "./task.js"

const signInSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    Task: [TaskModel.schema],
    date: {
        type: Date,
        default: Date.now
    }
});

const SignIn = model("signIn", signInSchema);
export default SignIn;
