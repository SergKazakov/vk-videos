import axios from "axios"

import * as auth from "./auth.mts"
import { env } from "./env.mts"

export class TokenExpiredError extends Error {}

export const refreshAccessToken = async () => {
  const { data } = await axios.post<{
    access_token: string
    refresh_token: string
  }>(
    "https://id.vk.ru/oauth2/auth",
    new URLSearchParams({
      grant_type: "refresh_token",
      client_id: env.CLIENT_ID,
      refresh_token: auth.refreshToken(),
      device_id: auth.deviceId(),
      state: "foo",
    }),
  )

  await auth.save({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  })
}

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

const getNewsfeedChunk = async (startFrom?: string) => {
  const {
    data: { error, response },
  } = await axios<Response>("https://api.vk.ru/method/newsfeed.get", {
    params: {
      ...(startFrom && { start_from: startFrom }),
      access_token: auth.accessToken(),
      filters: "video",
      v: "5.199",
    },
  })

  if (error) {
    throw error.error_code === 5
      ? new TokenExpiredError(error.error_msg)
      : new Error(error.error_msg)
  }

  return response
}

export async function* getNewsfeed() {
  let nextFrom: string | undefined

  do {
    const chunk = await getNewsfeedChunk(nextFrom)

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
