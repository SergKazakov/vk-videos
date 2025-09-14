import { cleanEnv, num, str, url } from "envalid"

export const env = cleanEnv(process.env, {
  CLIENT_ID: str(),
  BOT_TOKEN: str(),
  CHAT_ID: num(),
  MONGODB_URL: url(),
})
