# 多阶段构建 - 构建阶段
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:22-alpine AS production

# 安装安全更新
RUN apk update && apk upgrade && \
    rm -rf /var/cache/apk/*

# 创建非root用户和组
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 设置工作目录
WORKDIR /app

# 从构建阶段复制node_modules
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# 从构建阶段复制构建输出
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# 复制package.json
COPY --chown=nodejs:nodejs package*.json ./

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 运行应用
CMD ["node", "./dist/index.js"]
