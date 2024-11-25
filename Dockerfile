# 使用 Node.js 官方镜像作为基础镜像
FROM node:16

# 设置工作目录
WORKDIR /app

# 复制 package.json 文件
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 安装依赖
RUN npm run install
RUN npm run client-install

# 复制源代码
COPY . .

# 构建前端
RUN npm run client-build

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["npm", "start"] 