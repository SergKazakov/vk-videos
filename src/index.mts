import { readFile, writeFile } from "node:fs/promises"
import { setTimeout } from "node:timers/promises"

import axios, { isAxiosError } from "axios"
import { MongoBulkWriteError, MongoClient } from "mongodb"

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

type VideoSchema = { _id: { id: number; ownerId: number } }

const videoCollection = mongoClient.db().collection<VideoSchema>("videos")

async function* saveVideos() {
  const documents: VideoSchema[] = []

  const texts: string[] = []

  for await (const { id, ownerId, title } of vk.getNewsfeed(accessToken)) {
    documents.push({ _id: { id, ownerId } })

    texts.push(`<a href="https://vk.com/video${ownerId}_${id}">${title}</a>`)
  }

  if (documents.length === 0) {
    return
  }

  try {
    await videoCollection.insertMany(documents, { ordered: false })

    for (const text of texts) {
      yield text
    }
  } catch (error) {
    if (!(error instanceof MongoBulkWriteError)) {
      throw error
    }

    if (error.insertedCount === 0) {
      return
    }

    for (const i of Object.keys(error.insertedIds)) {
      yield texts[Number(i)]
    }
  }
}

const notify = (text: string) =>
  axios.post(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    chat_id: env.CHAT_ID,
    text,
    parse_mode: "HTML",
  })

const run = async () => {
  for await (const text of saveVideos()) {
    try {
      await notify(text)
    } catch (error) {
      if (!isAxiosError<{ parameters: { retry_after: number } }>(error)) {
        throw error
      }

      const seconds = error.response?.data?.parameters?.retry_after

      if (typeof seconds !== "number") {
        throw error
      }

      await setTimeout(seconds * 1000)

      await notify(text)
    }
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
