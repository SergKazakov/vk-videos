export const [BOT_TOKEN, CHAT_ID, CLIENT_ID, CLIENT_SECRET, MONGODB_URL] = [
  "BOT_TOKEN",
  "CHAT_ID",
  "CLIENT_ID",
  "CLIENT_SECRET",
  "MONGODB_URL",
].map(x => process.env[x] as string)
