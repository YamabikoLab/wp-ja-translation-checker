FROM node:22-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends vim \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

RUN mkdir -p /workspace/node_modules \
  && chown -R node:node /workspace

USER node
