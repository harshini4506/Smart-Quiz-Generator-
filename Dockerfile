FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY server ./server
COPY README.md ./README.md

RUN mkdir -p storage/uploads storage/vectors

EXPOSE 5000
CMD ["npm", "run", "server"]
