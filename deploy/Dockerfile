FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

COPY tsconfig.json SOUL.md ./
COPY src/ ./src/

RUN mkdir -p data

EXPOSE 3456

CMD ["bun", "run", "src/index.ts"]
