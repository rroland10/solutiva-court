FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY prisma ./prisma
RUN npm ci --workspace=apps/api && npm install prisma tsx && npx prisma generate

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY apps/api ./apps/api
COPY prisma ./prisma
RUN npm run build --workspace=apps/api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
EXPOSE 4000
CMD ["node", "dist/index.js"]
