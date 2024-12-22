import axios from "axios"
import puppeteer from "puppeteer-core"

import { env } from "./env.mts"

const clientId = { client_id: env.CLIENT_ID }

const redirectUri = { redirect_uri: "https://oauth.vk.ru/blank.html" }

const version = { v: "5.199" }

export const getAccessToken = async () => {
  const {
    data: { webSocketDebuggerUrl },
  } = await axios<{ webSocketDebuggerUrl: string }>(
    "http://localhost:9222/json/version",
  )

  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
  })

  const page = await browser.newPage()

  await page.goto(
    `https://oauth.vk.ru/authorize?${new URLSearchParams({
      ...clientId,
      ...redirectUri,
      ...version,
      response_type: "code",
      scope: "wall friends",
    })}`,
  )

  await page.waitForFunction(
    url => globalThis.location.href.startsWith(url),
    { timeout: 5000 },
    `${redirectUri.redirect_uri}#code=`,
  )

  const url = new URL(page.url())

  await page.close()

  await browser.disconnect()

  const code = new URLSearchParams(url.hash.substring(1)).get("code")!

  const { data } = await axios.post<{ access_token: string }>(
    "https://oauth.vk.ru/access_token",
    new URLSearchParams({
      ...clientId,
      ...redirectUri,
      client_secret: env.CLIENT_SECRET,
      code,
    }),
  )

  return data.access_token
}

export class TokenExpiredError extends Error {}

type Response = {
  error?: { error_code: number; error_msg: string }
  response: {
    items: {
      source_id: number
      video?: {
        items: {
          id: number
          owner_id: number
          title: string
          duration: number
        }[]
      }
    }[]
    next_from?: string
  }
}

const getNewsfeedChunk = async (accessToken: string, startFrom?: string) => {
  const {
    data: { error, response },
  } = await axios<Response>("https://api.vk.ru/method/newsfeed.get", {
    params: {
      ...version,
      ...(startFrom && { start_from: startFrom }),
      access_token: accessToken,
      filters: "video",
    },
  })

  if (error) {
    throw error.error_code === 5
      ? new TokenExpiredError(error.error_msg)
      : new Error(error.error_msg)
  }

  return response
}

export async function* getNewsfeed(accessToken: string) {
  let nextFrom: string | undefined

  do {
    const chunk = await getNewsfeedChunk(accessToken, nextFrom)

    for (const { source_id: sourceId, video } of chunk.items) {
      if (sourceId === -31352730 || !video) {
        continue
      }

      for (const { id, owner_id: ownerId, title, duration } of video.items) {
        if (duration < 5 * 60) {
          continue
        }

        yield { id, ownerId, title }
      }
    }

    nextFrom = chunk.next_from
  } while (nextFrom)
}
