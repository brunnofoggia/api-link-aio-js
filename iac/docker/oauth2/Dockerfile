FROM node:22-alpine

WORKDIR /app

COPY app/package.json app/package-lock.json* ./
RUN npm i

COPY app/server.js ./

EXPOSE 8080
CMD ["node", "server.js"]
