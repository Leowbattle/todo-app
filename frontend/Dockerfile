FROM node:25-alpine3.22 as builder

WORKDIR /code

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

COPY --from=builder /code/dist /usr/share/nginx/html

# Create nginx config for SPA routing and API proxy
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass ${BACKEND_URL}/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["sh", "-c", "sed -i \"s|\\${BACKEND_URL}|$BACKEND_URL|g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
