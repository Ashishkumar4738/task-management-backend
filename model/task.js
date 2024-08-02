import { Schema, model } from "mongoose";


const taskSchema = new Schema({
    title: {
        type: String
    },
    description: {
        type: String
    },
    status: {
        type: Boolean,
        default: false
    },
    dueStatus: {
        type: Date,
    },
    date: {
        type: Date,
        Default: Date.now()
    },
});

const TaskModel = model("Task", taskSchema);
export default TaskModel;