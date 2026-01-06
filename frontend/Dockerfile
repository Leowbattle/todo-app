FROM node:25-alpine3.22 as builder

WORKDIR /code

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

COPY --from=builder /code/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["sh", "-c", "envsubst '${PORT} ${BACKEND_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && cat /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
