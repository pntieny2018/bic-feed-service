FROM node:16.14 AS development

WORKDIR /usr/src/app

COPY package.json ./

COPY yarn.lock ./

RUN npm install -g @nestjs/cli

RUN yarn

COPY . .

RUN export NODE_OPTIONS="--max-old-space-size=5120"

RUN nest build


FROM node:16.14 as production

ARG NODE_ENV=production

ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json ./

COPY yarn.lock ./

RUN yarn --production

RUN yarn add @nestjs/swagger swagger-ui-express typescript ts-node  source-map-support

COPY --from=development /usr/src/app/dist ./dist

COPY --from=development /usr/src/app/sequelize ./sequelize

COPY --from=development /usr/src/app/.sequelizerc ./.sequelizerc


CMD ["node", "dist/src/main.js"]