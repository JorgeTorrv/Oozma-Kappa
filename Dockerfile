# syntax=docker/dockerfile:1

###############################################################################
# Acopio Hub — imagen para ejecutar la app en cualquier equipo con Docker.
#
#  - Node.js 20 LTS.
#  - SQLite persistida en /data (volumen nombrado, ver docker-compose.yml).
#  - Sin rutas absolutas del equipo del desarrollador: todo es portable.
#  - Al arrancar aplica migraciones y, si la base está vacía, carga el seed.
###############################################################################

FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3000
# La base vive en el volumen /data.
ENV DATABASE_URL="file:/data/acopio.db"

WORKDIR /app

# openssl: requerido por los motores de Prisma en Debian slim.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# 1) Dependencias (capa cacheable). Se copia también prisma/ porque el
#    `postinstall` ejecuta `prisma generate` y necesita el esquema.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2) Resto del código fuente + build.
COPY . .
RUN npx prisma generate && npm run build

# 3) Volumen para la base SQLite.
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000

# Migraciones + seed condicional + arranque.
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["npm", "run", "start"]
