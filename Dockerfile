FROM node:18-bullseye-slim

WORKDIR /usr/src/app

# Install dependencies needed for building native modules (if any)
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends -o Acquire::Retries=3 \
    build-essential python3 make gcc g++ \
    && rm -rf /var/lib/apt/lists/*

# copy package files and install
COPY package.json package-lock.json* ./
RUN npm install --production --silent

# copy app source
COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/server.js"]
