import Redis from "ioredis";

const redis = new Redis(`redis://127.0.0.1:6379`);
// const redis = new Redis(`redis://default:${process.env.REDIS_PASS}@redis-13688.c305.ap-south-1-1.ec2.redns.redis-cloud.com:13688`);


export default redis;