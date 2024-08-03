import { config } from "dotenv";
config();
import express from "express";
import catchMessage from "../helper/catchMessage.js";
import SignIn from "../model/signin.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator";
const router = express.Router();

router.post("/signin",
    body("email").isEmail(),
    body("password").isLength({ min: 6, message: "password should be minimum 6 length long" }),
    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return validation errors if there are any
            return res.status(400).send({ errors: errors.errors });
        }
        try {
            const { email, password } = req.body;

            const user = await SignIn.findOne({ email });
            if (!user) {
                catchMessage(res, "This email is not registered with us", 401);
                return;
            }
            const isMatchPassword = await bcrypt.compare(password, user.password);
            if (!isMatchPassword) {
                catchMessage(res, "Crediential are not matched! try again", 401);
                return;
            } else {
                const data = {
                    user: {
                        id: user.id
                    }
                };
                const jwtToken = jwt.sign(data, process.env.JWT_SECRET);
                res.status(201).send(
                    {success:true, message: "Account found successfully", jwtToken, name:user.name}
                )
            }
        } catch (error) {
            catchMessage(res, "Server side error while login", 500, error);
        }
    });


router.post("/signup", 
    body("email").isEmail(),
    body("password").isLength({ min: 6, message: "password should be minimum 6 length long" }),
    body("name").isLength({min:3,message:"name should have min 3 characters"}),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return validation errors if there are any
            console.log(errors.errors);
            return res.status(400).json({ errors: errors.errors });
        }
        try {
            // here we destructure all data
            const { name, email, password, address } = req.body;
            const user = await SignIn.findOne({ email });

            if (user) {
                // if user already exist with mail
                // we will send a message to frontend
                // using our own build function
                catchMessage(res, "User already exist with this mail", 401, "Warning");
                return;
            }
            // if user not present in db
            // create a newUser
            const salt = bcrypt.genSaltSync(10);
            const hashPassword = bcrypt.hashSync(password, salt);
            const newUser = SignIn({
                name,
                email,
                password: hashPassword,
                address
            });
            await newUser.save();
            // here we are extracting key for our token
            const data = {
                user: {
                    id: newUser.id
                }
            }
            const jwtToken = jwt.sign(data, process.env.JWT_SECRET);

            res.status(201).send(
                { success: true, message: "Your account is created successfully", jwtToken });

        } catch (error) {
            console.log(error);
            catchMessage(res, "Server side Error while signin", 500, error);
        }
    });

export default router;