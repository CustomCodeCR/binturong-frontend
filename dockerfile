FROM public.ecr.aws/docker/library/node:lts-alpine3.21 AS build

ARG VITE_APP_VERSION=1.0.9
ARG VITE_API_URL=http://200.234.228.70
ARG VITE_API_VERSION=
ARG VITE_APP_NAME=Binturong
ARG VITE_FRONTEND_DOMAIN=http://200.234.228.70

ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_VERSION=$VITE_API_VERSION
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_FRONTEND_DOMAIN=$VITE_FRONTEND_DOMAIN

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build-only

FROM public.ecr.aws/nginx/nginx:stable-alpine3.21

COPY --from=build /app/dist /usr/share/nginx/html
COPY default.conf.template /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
