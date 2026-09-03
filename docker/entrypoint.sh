#!/bin/sh
set -e

echo "Acopio Hub — aplicando migraciones de base de datos…"
npx prisma migrate deploy

# Siembra sólo si la base está vacía (idempotente para la demo / spec §33).
USERS=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(n=>{console.log(n);return p.\$disconnect()}).catch(()=>{console.log(0)})")
if [ "$USERS" = "0" ]; then
  echo "Base vacía: cargando datos de demostración…"
  npx prisma db seed
else
  echo "La base ya contiene datos ($USERS usuarios): no se vuelve a sembrar."
fi

echo "Iniciando Acopio Hub en el puerto ${PORT:-3000}…"
exec "$@"
