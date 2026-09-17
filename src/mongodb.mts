import { MongoClient } from "mongodb"

import { env } from "./env.mts"

export const mongoClient = await MongoClient.connect(env.MONGODB_URL)

const db = mongoClient.db()

export type VideoSchema = { _id: { id: number; ownerId: number } }

export const videoCollection = db.collection<VideoSchema>("videos")

export const authCollection = db.collection<{
  _id: string
  updatedAt: Date
  accessToken: string
  refreshToken: string
  deviceId: string
}>("auth")
