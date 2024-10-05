FROM node:lts-alpine

# Install build dependencies needed for native modules
RUN apk add --no-cache libc6-compat git python3 make g++ pkgconfig pixman-dev cairo-dev pango-dev jpeg-dev giflib-dev

WORKDIR /usr/src/app

# Copy package.json and lock files
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]

# Install dependencies, including those requiring native build, and ensure they're in the right place
RUN npm install && mv node_modules ../

# Copy remaining application files
COPY . .

# Create the temp directory and set ownership for the node user
RUN mkdir -p /usr/src/app/temp \
    && chown -R node:node /usr/src/app/temp \
    && chown -R node /usr/src/app \
    && chown -R node /usr

# Expose the app's port
EXPOSE 3500

# Run the app as a non-root user
USER node

# Start the application
CMD ["npm", "start"]
