import * as redis from "redis";
import envConfig from "../env.config";
const url = `redis://default:${envConfig.REDIS_PASSWORD}@${envConfig.REDIS_HOST}:${envConfig.REDIS_PORT}`;

const redisClient = redis.createClient({ url });
redisClient;
(async () => {
	await redisClient.connect();
})();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient.on("connect", () => {
	console.log("Redis Connected!");
});
redisClient.on("reconnecting", () =>
	console.log("redis client is reconnecting")
);
redisClient.on("ready", () => console.log("redis client is ready"));

export default redisClient;
