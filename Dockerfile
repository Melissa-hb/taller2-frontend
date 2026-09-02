# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- Dependencias ----
# Se copian primero los manifiestos para aprovechar la cache de capas
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- App ----
COPY server.js ./
COPY public ./public

# El servidor Express escucha en este puerto (configurable con PORT)
EXPOSE 3000

# Usuario sin privilegios (la imagen node ya trae el usuario "node")
USER node

# Healthcheck contra el endpoint /status del propio frontend
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
