import Redis from 'ioredis';
export default () => {
  const redisSetting = {
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST,
    db: 0,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
  const redis = new Redis(
    Number(process.env.REDIS_PORT),
    process.env.REDIS_HOST,
    redisSetting,
  );
  return {
    redis,
  };
};
