# syntax=docker/dockerfile:1
# ---- Build: statik fayllar ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --mount=cache: npm yuklab olishlari build'lar orasida saqlanadi.
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# ---- Run: nginx ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
