FROM denoland/deno


WORKDIR /srv
COPY . .

RUN echo "PATH: $(pwd)"

RUN deno cache ./server/server.js

ENTRYPOINT [ "bash", "entry.sh" ]