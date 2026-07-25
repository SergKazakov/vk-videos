import { cleanEnv, num, str, url } from "envalid"

export const env = cleanEnv(Bun.env, {
  BOT_TOKEN: str(),
  CHAT_ID: num(),
  CLIENT_ID: str(),
  MONGODB_URL: url(),
})
