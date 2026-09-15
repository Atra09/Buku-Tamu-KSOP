FROM node:20-alpine

ENV TZ=Asia/Jakarta
RUN apk add --no-cache tzdata

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3002

CMD ["node", "./bin/www"]

