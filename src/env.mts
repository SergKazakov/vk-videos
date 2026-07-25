import { cleanEnv, num, str, url } from "envalid"

export const env = cleanEnv(Bun.env, {
  BOT_TOKEN: str({ testDefault: "foo" }),
  CHAT_ID: num({ testDefault: 0 }),
  CLIENT_ID: str({ testDefault: "foo" }),
  MONGODB_URL: url({ testDefault: "mongodb://localhost" }),
})
