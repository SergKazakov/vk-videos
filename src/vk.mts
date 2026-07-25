import axios from "axios"

import * as auth from "./auth.mts"
import { env } from "./env.mts"

export class TokenExpiredError extends Error {}

export const refreshAccessToken = async () => {
  const { data } = await axios.post<{
    error?: string
    error_description?: string
    access_token?: string
    refresh_token?: string
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

  if (data.error) {
    throw new Error(data.error_description ?? data.error)
  }

  if (!(data.access_token && data.refresh_token)) {
    throw new Error("No tokens in response")
  }

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
      || error.error_msg.includes("could not check access_token now")
      ? new TokenExpiredError(error.error_msg)
      : new Error(error.error_msg)
  }

  return response
}

const getVideoItems = (
  items: NonNullable<Response["response"]["items"][number]["video"]>["items"],
) =>
  items.reduce<{ id: number; ownerId: number; title: string }[]>((acc, it) => {
    if (it.duration >= 5 * 60) {
      acc.push({ id: it.id, ownerId: it.owner_id, title: it.title })
    }

    return acc
  }, [])

export async function* getNewsfeed() {
  let nextFrom: string | undefined

  do {
    const chunk = await getNewsfeedChunk(nextFrom)

    for (const { source_id: sourceId, video } of chunk.items) {
      if (sourceId !== -31_352_730 && video) {
        yield* getVideoItems(video.items)
      }
    }

    nextFrom = chunk.next_from
  } while (nextFrom)
}
