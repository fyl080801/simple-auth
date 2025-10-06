# Simple Auth

a simple jwt token service

## 使用Docker运行

### 构建并运行容器

```bash
# 使用docker-compose
docker-compose up --build

# 或者使用Docker命令
docker build -t simple-auth .
docker run -p 3000:3000 -e SECRET_KEY=your_secret_key simple-auth
```

### API端点

- `POST /generate` - 生成JWT令牌
  - 请求体: `{"key": "value"}`
  - 响应: `{"token": "jwt_token"}`

- `GET /auth` - 验证JWT令牌
  - 请求头: `Authorization: Bearer <token>`
  - 响应: 成功返回200状态码，失败返回401状态码

### 环境变量

- `SECRET_KEY` - JWT签名密钥（必需）
- `PORT` - 应用端口（默认: 3000）
- `NODE_ENV` - 运行环境（默认: production）
