import { readFile, writeFile } from "node:fs/promises"

let auth: {
  accessToken: string
  refreshToken: string
  deviceId: string
} = JSON.parse(await readFile("./auth.json", { encoding: "utf8" }))

export const accessToken = () => auth.accessToken

export const refreshToken = () => auth.refreshToken

export const deviceId = () => auth.deviceId

export const save = async (data: {
  accessToken: string
  refreshToken: string
}) => {
  auth = { ...auth, ...data }

  await writeFile("./auth.json", JSON.stringify(auth, null, 2))
}
