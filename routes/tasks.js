import express from "express";
import TaskModel from "../model/task.js";
import SignIn from "../model/signin.js";
import fetchUser from "../middleware/fetchUser.js";
import catchMessage from "../helper/catchMessage.js";
import { body, validationResult } from "express-validator";
const router = express.Router();


router.post("/createtask",
    body("title").isLength({ min: 3, message: "title minimum length should be 3" }),
    body("description").isLength({ min: 10, message: "description minimun length should be 10" }),
    body("dueStatus").notEmpty(), fetchUser, async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return validation errors if there are any
            return res.status(400).json({ errors: errors.array() });
        }
        // this user veriable hold a id which we fetched from our middleware

        const user = req.user;
        const id = user.id;
        try {
            const user = await SignIn.findById(id);

            if (!user) {
                fetchUser(res, "You are not authorised for this task.", 401);
                return;
            }

            const { title, description, dueStatus } = req.body;

            const task = new TaskModel({ title, description, dueStatus });

            user.Task.push(task);
            await user.save();
            res.status(201).send({ success: true, message: "Task added successfully" });

        } catch (error) {
            catchMessage(res, "Server side error when creating task", 500, error);
            return;
        }
});

router.get("/fetchalltasks", fetchUser, async (req, res) => {
    const user = req.user;
    const id = user.id;
    try {
        const user = await SignIn.findById(id);

        if (!user) {
            catchMessage(res, "You are not authorised to access tasks", 401);
            return;
        }

        res.status(201).send({ success: true, message: "List fetched successfully", task: user.Task });
        return;


    } catch (error) {
        catchMessage(res, "Server side error when fetching all tasks", 500, error);
        return;
    }

})

router.get("/fetchbyid", fetchUser, async (req, res) => {
    const user = req.user;
    const id = user.id;
    try {

        const taskId = req.query.taskid;
        const user = await SignIn.findById(id);

        if (!user) {
            catchMessage(res, "You are not authorised to do this task", 401, "");
            return;
        }

        const task = user.Task.id(taskId);
        if (!task) {
            catchMessage(res, "Task not present for this id", 404, "");
            return;
        }

        console.log(task);
        res.status(201).send({ success: true, message: "Task found successfully", task });



    } catch (error) {
        catchMessage(req, "Server side Error when fetching by id", 500, error);

    }
});

router.put("/updateexistingtask", fetchUser, async (req, res) => {
    const user = req.user;
    const id = user.id;
    try {
        const user = await SignIn.findById(id);

        if (!user) {
            catchMessage(res, "You are not authorised to do this task", 401, "");
            return;
        }

        const taskId = req.query.taskid;
        if (!taskId) {
            catchMessage(res, "Please proide a task id", 404, "");
            return;
        }

        const { title, description, status, dueStatus } = req.body;
        if (title) {
            user.Task.id(taskId).title = title;
        }
        if (description) {
            user.Task.id(taskId).description = description;
        }
        if (status) {
            user.Task.id(taskId).status = status;
        }
        if (dueStatus) {
            user.Task.id(taskId).dueStatus = dueStatus;
        }

        await user.save();
        res.status(201).send({ success: true, message: "Task Updated Successfully" });

    } catch (error) {
        catchMessage(res, "Server side error ", 500, error);
        return;
    }
});

router.delete("/deletetask", fetchUser, async (req, res) => {
    const user = req.user;
    const id = user.id;
    try {
        const user = await SignIn.findById(id);

        console.log(user);
        if (!user) {
            catchMessage(res, "You are not authorised to do this task", 401, "");
            return;
        }

        const taskId = req.query.taskid;
        if (!taskId) {
            catchMessage(res, "Please provide a task id", 404, "");
            return;
        }
        user.Task.pop(user.Task.id(taskId));


        await user.save();
        res.status(201).send({ success: true, message: "Task Updated Successfully" });

    } catch (error) {
        catchMessage(res, "Server side error ", 500, error);
        return;
    }
});


export default router;