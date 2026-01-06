FROM node:25-alpine3.22 as builder

WORKDIR /code

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
