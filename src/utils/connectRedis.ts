import { createClient } from "redis";

const redisClient = createClient({
  url: "redis://localhost:6378",
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error: any) {
    setInterval(connectRedis, 5000);
  }
};

connectRedis();

redisClient.on("connect", () =>
  console.log("🚀 Redis client connected successfully")
);

redisClient.on("error", (err) => console.error(err));

export default redisClient;
