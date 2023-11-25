##------ARGUMENTS------##
ARG NODE_VERSION=16.20.2
ARG ALPINE_VERSION=alpine3.18
ARG WORKDIR=/usr/src/app

##------BUILDER STAGE------## 
FROM node:${NODE_VERSION} AS builder

ARG WORKDIR
WORKDIR ${WORKDIR}

# Install the NestJS CLI globally.
RUN yarn global add @nestjs/cli

# Install dependencies
COPY package.json yarn.lock ./ 
RUN yarn --frozen-lockfile
     
# Build the application and remove development dependencies
COPY . .
RUN yarn build \
    && yarn --production --ignore-scripts --prefer-offline --frozen-lockfile

##------FINAL STAGE------## 
FROM node:${NODE_VERSION}-${ALPINE_VERSION}

ARG WORKDIR
WORKDIR ${WORKDIR}

# Set the Node.js environment to production.
ENV NODE_ENV production

# Install Tini to handle signal and zombie processes.
# Install Libpg libpq to support interface for PostgreSQL.
# And install Sequelize CLI globally for database migrations.
RUN apk add --no-cache tini libpq \
    && yarn global add sequelize-cli

# Copy entrypoint script
COPY --chown=node:node --chmod=765 entrypoint.sh ./
COPY --chown=node:node package.json .sequelizerc ./

# Copy built files from the builder stage
COPY --chown=node:node --from=builder ${WORKDIR}/node_modules ./node_modules
COPY --chown=node:node --from=builder ${WORKDIR}/sequelize ./sequelize
COPY --chown=node:node --from=builder ${WORKDIR}/dist/apps/api ./dist

# Running the container as a non-root user
USER node

# Set the entry point for the container.
ENTRYPOINT ["./entrypoint.sh"]

# Default command to run when the container starts.
CMD ["node", "dist/main.js"]
