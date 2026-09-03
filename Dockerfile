# syntax=docker/dockerfile:1

###############################################################################
# Acopio Hub — imagen para ejecutar la app en cualquier equipo con Docker.
#
#  - Node.js 20 LTS.
#  - Base PostgreSQL (servicio `db` de docker-compose, o Supabase en la nube).
#  - Sin rutas absolutas del equipo del desarrollador: todo es portable.
#  - Al arrancar aplica migraciones y, si la base está vacía, carga el seed.
###############################################################################

FROM node:20-bookworm-slim

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

# openssl / ca-certificates: requeridos por los motores de Prisma y TLS.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# 1) Dependencias (capa cacheable). Se copia prisma/ porque el `postinstall`
#    ejecuta `prisma generate` y necesita el esquema.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2) Resto del código + build.
COPY . .
RUN npx prisma generate && npm run build

EXPOSE 3000

# Migraciones + seed condicional + arranque.
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["npm", "run", "start"]
