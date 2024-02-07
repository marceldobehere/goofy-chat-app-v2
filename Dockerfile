FROM glowman554/deno


WORKDIR /srv
COPY . .

RUN deno cache ./server/server.js

ENTRYPOINT [ "bash", "entry.sh" ]