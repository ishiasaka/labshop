FROM node:24.14.0-slim
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY src/package.json src/package-lock.json ./
RUN npm install
COPY server.js ./
COPY public ./public
EXPOSE 3001
CMD [ "npm", "start"]