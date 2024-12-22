import { readFile, writeFile } from "node:fs/promises"

import axios from "axios"
import { MongoClient } from "mongodb"

import * as env from "./env.mts"
import * as vk from "./vk.mts"

let accessToken = ""

try {
  accessToken = await readFile("./access-token.txt", { encoding: "utf8" })
} catch {}

const refreshAccessToken = async () => {
  accessToken = await vk.getAccessToken()

  await writeFile("./access-token.txt", accessToken)
}

if (!accessToken) {
  await refreshAccessToken()
}

const mongoClient = await MongoClient.connect(env.MONGODB_URL)

const videoCollection = mongoClient
  .db()
  .collection<{ _id: { id: number; ownerId: number } }>("videos")

const run = async () => {
  for await (const { id, ownerId, title } of vk.getNewsfeed(accessToken)) {
    try {
      await videoCollection.insertOne({ _id: { id, ownerId } })

      await axios.post(
        `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
        {
          chat_id: env.CHAT_ID,
          text: `<a href="https://vk.com/video${ownerId}_${id}">${title}</a>`,
          parse_mode: "HTML",
        },
      )
    } catch {}
  }
}

try {
  await run()
} catch (error) {
  if (!(error instanceof vk.TokenExpiredError)) {
    throw error
  }

  await refreshAccessToken()

  await run()
} finally {
  await mongoClient.close()
}
