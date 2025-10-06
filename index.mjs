import "dotenv/config"
import jwt from "jsonwebtoken"
import express from "express"

const SECRET_KEY = process.env.SECRET_KEY
const PORT = process.env.PORT || 3000

function generateToken(payload = {}) {
  // payload 推荐只放 sub、role、scope 等非敏感信息
  return jwt.sign(
    {
      ...payload,
      timestamp: new Date().valueOf()
    },
    SECRET_KEY,
    {
      issuer: "simple-auth"
      // expiresIn: ACCESS_TOKEN_EXPIRES
    }
  )
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY, { issuer: "simple-auth" })
    return decoded
  } catch (err) {
    throw err
  }
}

const app = express()

app.use(express.json())

app.get("/auth", (req, res) => {
  const authHeader = req.headers["authorization"]

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ msg: "Missing Authorization header" })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const payload = verifyToken(token)

    if (!payload) {
      res.status(401).json({ msg: "Authorization failed" })
      return
    }

    res.status(200).json({
      result: "success"
    })
  } catch (err) {
    res.status(401).json({ msg: err.message })
  }
})

app.post("/generate", (req, res) => {
  const token = generateToken(req.body)

  console.log(new Date(), "generate a token")

  res.status(200).json({
    token
  })
})

app.listen(PORT, (err) => {
  if (err) {
    console.error(err)
    return
  }

  console.log(`listen: ${PORT}`)
})
