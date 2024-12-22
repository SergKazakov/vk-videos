import { cleanEnv, num, str, url } from "envalid"

export const env = cleanEnv(process.env, {
  BOT_TOKEN: str(),
  CHAT_ID: num(),
  CLIENT_ID: str(),
  CLIENT_SECRET: str(),
  MONGODB_URL: url(),
})
