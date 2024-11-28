FROM node:20-alpine AS builder

WORKDIR /app

COPY . /app

RUN npm i && npm run build:only

# detail https://github.com/lipanski/docker-static-website/blob/master/Dockerfile
FROM lipanski/docker-static-website

WORKDIR /home/static

LABEL MAINTAINER=lurenyang<lurenyang@outlook.com>

COPY --from=builder /app/dist /home/static

EXPOSE 80

CMD ["/busybox-httpd", "-f", "-v", "-p", "80", "-c", "httpd.conf"]