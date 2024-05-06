FROM node:20-buster

RUN apt-get update && apt-get install -y unzip

ENV RCLONE_VERSION="1.53.1"

RUN curl -O https://downloads.rclone.org/v${RCLONE_VERSION}/rclone-v${RCLONE_VERSION}-linux-amd64.zip \
    && unzip rclone-v${RCLONE_VERSION}-linux-amd64.zip \
    && mv rclone-v${RCLONE_VERSION}-linux-amd64/rclone /usr/bin/ \
    && chown root:root /usr/bin/rclone \
    && chmod 755 /usr/bin/rclone \
    && rm -rf rclone-v${RCLONE_VERSION}-linux-amd64.zip rclone-v${RCLONE_VERSION}-linux-amd64

WORKDIR /usr/src/app

COPY dist ./

CMD ["node", "index.js"]