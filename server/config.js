require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'production',
  email: {
    user: process.env.EMAIL_USER || 'islamsaib100@gmail.com',
    pass: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  tiktok: {
    clientKey: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    accessToken: process.env.TIKTOK_ACCESS_TOKEN,
  },
  contentrewards: {
    username: process.env.CONTENTREWARDS_USERNAME,
    password: process.env.CONTENTREWARDS_PASSWORD,
  },
  nvidia: {
    apiKey: process.env.NVIDIA_NIM_API_KEY,
    baseUrl: process.env.NVIDIA_NIM_BASE_URL || 'https://ai.api.nvidia.com/v1',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'wakeel_secret',
  },
  paths: {
    storage: require('path').join(__dirname, '..', 'storage'),
    videos: require('path').join(__dirname, '..', 'storage', 'videos'),
    downloads: require('path').join(__dirname, '..', 'storage', 'downloads'),
    logs: require('path').join(__dirname, '..', 'storage', 'logs'),
    db: require('path').join(__dirname, '..', 'storage', 'db'),
  },
};

module.exports = config;
