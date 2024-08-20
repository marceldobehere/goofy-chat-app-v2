FROM denoland/deno


WORKDIR /srv
COPY . .

RUN deno cache ./server/server.js

ENTRYPOINT [ "bash", "entry.sh" ]