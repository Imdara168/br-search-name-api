# br-search-name-api

NestJS API built with TypeScript and MySQL. The app listens on port `8080` by default.

## Setup

```bash
npm.cmd install
copy .env.example .env
docker compose up -d mysql
npm.cmd run start:dev
```

Open `http://localhost:8080/health` to check the API.

## Docker

```bash
docker compose up --build -d
```

This starts MySQL and the API. The API container applies Prisma migrations before starting NestJS.

Open `http://localhost:8080/health` to check the containerized API.

## Environment

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8080` | HTTP server port |
| `DATABASE_URL` | `mysql://root:password@localhost:3306/br_search_name` | MySQL connection URL |
| `DB_SYNCHRONIZE` | `true` | Auto-sync entities during development |
| `DB_LOGGING` | `false` | Enable SQL query logging |
