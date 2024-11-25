# 使用 Node.js 官方镜像作为基础镜像
FROM node:16

# 设置工作目录
WORKDIR /app

# 复制 package.json 文件
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# 安装后端依赖
RUN cd server && npm install

# 安装前端依赖
RUN cd client && npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 设置环境变量
ENV CI=false
ENV GENERATE_SOURCEMAP=false
ENV DISABLE_ESLINT_PLUGIN=true

# 构建前端
RUN cd client && DISABLE_ESLINT_PLUGIN=true CI=false npm run build

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["npm", "start"] 