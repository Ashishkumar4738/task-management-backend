import { config } from "dotenv";
config();
import mongoose, { mongo } from "mongoose";

main().catch((err)=>console.log("Db connection error ",err));

async function main(){
    await mongoose.connect(process.env.MONGOOSE_URI);
    console.log("db Connected successfully");
}


export default main;