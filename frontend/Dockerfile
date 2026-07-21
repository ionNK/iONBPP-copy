# Base Image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Next.js app
RUN npm run build

# --- Production Runner ---
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Creating a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port (ensure this matches Next.js config or user expectation, standard is 3000)
EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
