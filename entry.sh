cd ./server

mkdir data/ssl -p

# Change this to your domain
cp /etc/letsencrypt/live/goofy2.marceldobehere.com/fullchain.pem data/ssl/cert.pem
cp /etc/letsencrypt/live/goofy2.marceldobehere.com/privkey.pem data/ssl/key.pem

exec deno run -A server.js -https