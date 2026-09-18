FROM node:22-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev

COPY src ./src
COPY public ./public
COPY start.js ./start.js

EXPOSE 8080

CMD ["node", "start.js"]