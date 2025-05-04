# Dockerfile
# 1. Base Image - Use a standard Node.js image (Debian-based)
FROM node:20 AS base

# Set working directory
WORKDIR /app

# Install dependencies first for layer caching
COPY package.json package-lock.json* ./
# Use 'npm ci' for clean, reproducible installs based on lock file
RUN npm ci

# 2. Builder Stage - Build the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
# Ensure NEXT_PUBLIC_ variables are available if needed during build
# ENV NEXT_PUBLIC_API_URL=http://example.com
RUN npm run build

# 3. Runner Stage - Setup the production environment
# Use the same base image type for the runner
FROM node:20 AS runner 
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Optionally create a non-root user for security
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs
# USER nextjs

# Copy necessary files from builder stage
COPY --from=builder /app/public ./public
# Add --chown flags if using non-root user
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application using the Node.js server
# Requires 'output: "standalone"' in next.config.js
CMD ["node", "server.js"]

# --- Alternative CMD if NOT using output: "standalone" ---
# If you are not using the standalone output mode in next.config.js,
# copy the full .next directory and node_modules, and use 'npm start':
# FROM base AS runner-legacy
# WORKDIR /app
# ENV NODE_ENV production
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S nextjs -u 1001
# USER nextjs
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/.next ./.next
# COPY --from=builder /app/node_modules ./node_modules
# COPY package.json ./package.json
# EXPOSE 3000
# CMD ["npm", "start"]
# ---------------------------------------------------------
