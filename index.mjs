import "dotenv/config"
import jwt from "jsonwebtoken"
import express from "express"

// 环境变量验证
const SECRET_KEY = process.env.SECRET_KEY
const PORT = process.env.PORT || 3000
const NODE_ENV = process.env.NODE_ENV || "development"

if (!SECRET_KEY) {
  console.error("错误: 缺少必需的环境变量 SECRET_KEY")
  process.exit(1)
}

// 创建 Express 应用
const app = express()

// 优雅关闭处理
let server

const gracefulShutdown = (signal) => {
  console.log(`\n收到 ${signal} 信号，正在优雅关闭服务器...`)
  
  if (server) {
    server.close((err) => {
      if (err) {
        console.error("关闭服务器时出错:", err)
        process.exit(1)
      }
      console.log("服务器已成功关闭")
      process.exit(0)
    })
    
    // 强制关闭超时
    setTimeout(() => {
      console.error("强制关闭服务器（超时）")
      process.exit(1)
    }, 10000)
  } else {
    process.exit(0)
  }
}

// 监听进程信号
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
process.on("SIGINT", () => gracefulShutdown("SIGINT"))

// 处理未捕获的异常
process.on("uncaughtException", (err) => {
  console.error("未捕获的异常:", err)
  gracefulShutdown("uncaughtException")
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("未处理的 Promise 拒绝:", reason)
  gracefulShutdown("unhandledRejection")
})

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

// 中间件
app.use(express.json())

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now()
  res.on("finish", () => {
    const duration = Date.now() - start
    console.log(`${new Date().toISOString()} ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`)
  })
  next()
})

// 健康检查端点
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  })
})

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

// 启动服务器
const startServer = () => {
  try {
    server = app.listen(PORT, () => {
      console.log(`\n🚀 服务器启动成功!`)
      console.log(`📍 端口: ${PORT}`)
      console.log(`🌍 环境: ${NODE_ENV}`)
      console.log(`⏰ 启动时间: ${new Date().toISOString()}`)
      console.log(`🔗 健康检查: http://localhost:${PORT}/health`)
      console.log(`\n按 Ctrl+C 停止服务器\n`)
    })

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`错误: 端口 ${PORT} 已被占用`)
      } else {
        console.error("服务器启动错误:", err)
      }
      process.exit(1)
    })
  } catch (err) {
    console.error("启动服务器时出错:", err)
    process.exit(1)
  }
}

// 启动应用
startServer()
