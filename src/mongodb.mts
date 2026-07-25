import { MongoClient } from "mongodb"

import { env } from "./env.mts"

export const mongoClient = await MongoClient.connect(env.MONGODB_URL)

export type VideoSchema = { _id: { id: number; ownerId: number } }

export const videoCollection = mongoClient
  .db()
  .collection<VideoSchema>("videos")
