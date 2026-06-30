FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY ../../packages /packages
RUN npm ci --ignore-scripts

COPY . .
RUN npx prisma generate --schema=../../packages/db/prisma/schema.prisma
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY ../../packages/db/prisma ./prisma

EXPOSE 3000

ENV NODE_ENV=production
CMD ["node", "dist/main"]
