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
    params: { per_page: 1, name: "auth-state" },
  })

  if (!artifacts[0]) {
    console.log(`Deleted ${count} artifact(s)`)

    break
  }

  await github.delete(String(artifacts[0].id))

  ++count
}
