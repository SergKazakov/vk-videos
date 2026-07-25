import { GenericContainer, Wait } from "testcontainers"
import { afterAll, expect, it, vi } from "vitest"

const container = await new GenericContainer("mongo:8")
  .withExposedPorts(27_017)
  .withWaitStrategy(Wait.forLogMessage(/Waiting for connections/i))
  .start()

Bun.env.MONGODB_URL = `mongodb://${container.getHost()}:${container.getMappedPort(27_017)}/test`

afterAll(async () => {
  const { mongoClient } = await import("./mongodb.mts")

  await mongoClient.close()

  await container.stop()
})

vi.mock("axios", () => ({
  default: Object.assign(
    vi.fn().mockResolvedValue({
      data: {
        response: {
          items: [
            {
              source_id: -31_352_730,
              video: {
                items: [{ id: 0, owner_id: 0, title: "", duration: 300 }],
              },
            },
            {
              source_id: 0,
              video: {
                items: [
                  { id: 1, owner_id: 1, title: "short", duration: 299 },
                  { id: 2, owner_id: 2, title: "", duration: 300 },
                ],
              },
            },
          ],
        },
      },
    }),
    { post: vi.fn() },
  ),
  isAxiosError: vi.fn(),
}))

vi.mock("./auth.mts", () => ({
  accessToken: vi.fn(),
  deviceId: vi.fn(),
  refreshToken: vi.fn(),
  save: vi.fn(),
}))

it("should filter VK videos before saving them", async () => {
  const { run } = await import("./index.mts")

  await run()

  await run()

  const { videoCollection } = await import("./mongodb.mts")

  await expect(videoCollection.find().toArray()).resolves.toEqual([
    { _id: { id: 2, ownerId: 2 } },
  ])
})
