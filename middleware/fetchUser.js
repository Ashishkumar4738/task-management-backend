import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";
import catchMessage from "../helper/catchMessage.js";

const fetchUser = (req,res,next)=>{
    // we req token from frontend name will be auth_token
    const token = req.header("auth_token");
    if(!token){
        catchMessage(res,"token is not valid",401);
        return;
    }
    try{
        const data = jwt.verify(token,process.env.JWT_SECRET);
        req.user = data.user;
        next();

    }catch (error){
        catchMessage(res,"Server side problem when checking for token",500,error);
        return;
    }
}

export default fetchUser;