import { join } from "node:path"

const path = join(process.cwd(), "auth.json")

let auth: { accessToken: string; refreshToken: string; deviceId: string } =
  await Bun.file(path).json()

export const accessToken = () => auth.accessToken

export const refreshToken = () => auth.refreshToken

export const deviceId = () => auth.deviceId

export const save = async (data: {
  accessToken: string
  refreshToken: string
}) => {
  auth = { ...auth, ...data }

  await Bun.write(path, JSON.stringify(auth, null, 2))
}
