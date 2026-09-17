import axios from "axios"

const github = axios.create({
  baseURL:
    "https://api.github.com/repos/SergKazakov/vk-videos/actions/artifacts",
  headers: { Authorization: `Bearer ${Bun.env.GITHUB_TOKEN}` },
})

let count = 0

for (;;) {
  const {
    data: { artifacts },
  } = await github<{ artifacts: { id: number }[] }>("", {
    params: { name: "auth-state" },
  })

  if (artifacts.length === 0) {
    console.log(`Deleted ${count} artifact(s)`)

    break
  }

  await Promise.all(artifacts.map(it => github.delete(String(it.id))))

  count += artifacts.length
}
