# 监控系统Admin前端 Dockerfile
# 基于Node.js 18 Alpine构建，支持多阶段构建优化

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    git \
    && rm -rf /var/cache/apk/*

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 安装必要的工具
RUN apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# 复制构建产物到nginx目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 创建非root用户
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# 设置目录权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# 切换到非root用户
USER nginx

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
