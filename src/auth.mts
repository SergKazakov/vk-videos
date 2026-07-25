const file = Bun.file("auth.json")

let auth: { accessToken: string; refreshToken: string; deviceId: string } =
  await file.json()

export const accessToken = () => auth.accessToken

export const refreshToken = () => auth.refreshToken

export const deviceId = () => auth.deviceId

export const save = async (data: {
  accessToken: string
  refreshToken: string
}) => {
  auth = { ...auth, ...data }

  await Bun.write(file, JSON.stringify(auth, null, 2))
}
