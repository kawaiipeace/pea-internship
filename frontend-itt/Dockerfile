# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source code (excluding node_modules via .dockerignore)
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY store ./store
COPY styles ./styles
COPY public ./public
COPY App.tsx ./
COPY next.config.ts ./
COPY tsconfig.json ./
COPY postcss.config.mjs ./
COPY tailwind.config.js ./
COPY theme.config.tsx ./
COPY eslint.config.mjs ./
COPY i18n.ts ./
COPY ni18n.config.js ./

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Install pnpm
RUN npm install -g pnpm

# Set production environment
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 2701

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:2701', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["pnpm", "start"]
