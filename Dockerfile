# Use minimal Alpine-based Bun image
FROM oven/bun:1-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client if schema exists
RUN if [ -f "database/schema.prisma" ]; then bunx prisma generate; fi

# Create data directory
RUN mkdir -p /app/data

# Expose port and define command
EXPOSE 8080
CMD ["bun", "start"] 