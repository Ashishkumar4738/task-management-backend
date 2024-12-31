import { config } from "dotenv";
config();
import express from "express";
import catchMessage from "../helper/catchMessage.js";
import SignIn from "../model/signin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, check, validationResult } from "express-validator";
import nodemailer from "nodemailer";
import redis from "../client/client.js";
const router = express.Router();

// patch for partial updates
// put for full updates

router.post("/sendmail", async (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const mail = req.body.email;
  console.log(mail);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Ashish Kumar 🙌 <av314880@gmail.com> `,
    to: `${mail}`,
    subject: "OTP - Reset password",
    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2 style="color: #2c3e50;">Hello!</h2>
      <p style="font-size: 16px; color: #333;">
        Your One-Time Password ${otp} for accessing your account is:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #e74c3c;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #555;">
        Please use this OTP within the next 10 minutes to complete your action. For your security, do not share this code with anyone.
      </p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      <p style="font-size: 12px; color: #999;">
        If you did not request this OTP, please ignore this email or contact our support team immediately.
      </p>
    </div>
  `,
  };

  transporter.sendMail(mailOptions, async function (error, info) {
    if (error) {
      console.log("Error when sending mail", error);
      res.status(500).send("Unable to send mail");

    } else {
      await redis.set(mail, otp, 'EX', 600); 
      res.status(201).send({ status: true, message: "Mail sent successfully!" });
    }
  });
});


router.post(
  "/signin",
  body("email").isEmail().withMessage("Email is not valid"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("password should be minimum 6 length long"),
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
            id: user.id,
          },
        };
        const jwtToken = jwt.sign(data, process.env.JWT_SECRET);
        res.status(201).send({
          success: true,
          message: "Account found successfully",
          jwtToken,
          name: user.name,
        });
      }
    } catch (error) {
      catchMessage(res, "Server side error while login", 500, error);
    }
  }
);

router.post("/matchotp", async(req,res)=>{
  try {
    const otp = req.body.otp.join("");
    const email = req.body.email;
    const value = await redis.get(email);
    console.log(otp," ",value);
    if(value === otp){
      await redis.del(email);
      await redis.set(email, "verified", 'EX' , 300);
      return res.status(201).send({ status: true, message: "Your OTP Matched Successfully!" });
    }else{
      return res.status(404).send({ status: false, message: "Your OTP has expired or is incorrect!" });
    }
  } catch (error) {
    catchMessage(res, "Server side error while login", 500, error);
  }
});

router.post("/updatepassword", async (req, res) => {
  try {
    const { mail, password } = req.body;

    // Find the user by email
    let user = await SignIn.findOne({ email: mail });
    if (!user) {
      return res.status(401).send({ status: false, message: "This email is not present in the database." });
    }
    
    // Fetch OTP from Redis
    const checkVerify = await redis.get(mail);
    console.log(mail," ",checkVerify);
    
    if (checkVerify !== "verified") {
      return res.status(404).send({ status: false, message: "You are not verified again send otp!" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Update user's password and save to the database
    user = await SignIn.findOneAndUpdate(
      { email: mail }, // Find the user by email
      { $set: { password: hashPassword } }, // Update only the password field
      { new: true, runValidators: false } // Return the updated document, skip validations
    );
    

    // Generate a JWT token
    const data = {
      user: {
        id: user.id,
      },
    };
    const jwtToken = jwt.sign(data, process.env.JWT_SECRET);

    // Send a success response
    await redis.del(mail);
    res.status(201).send({
      success: true,
      message: "Your password has been updated successfully.",
      jwtToken,
    });

  } catch (error) {
    // Catch and handle errors
    catchMessage(res, "Server side error while updating password", 500, error);
  }
});



router.post(
  "/signup",
  body("email").isEmail().withMessage("Email is not valid"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("password should be minimum 6 length long"),
  body("name")
    .isLength({ min: 3 })
    .withMessage("name should have min 3 characters"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Return validation errors if there are any
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
        address,
      });
      await newUser.save();
      // here we are extracting key for our token
      const data = {
        user: {
          id: newUser.id,
        },
      };
      const jwtToken = jwt.sign(data, process.env.JWT_SECRET);

      res.status(201).send({
        success: true,
        message: "Your account is created successfully",
        jwtToken,
      });
    } catch (error) {
      catchMessage(res, "Server side Error while signin", 500, error);
    }
  }
);

export default router;
