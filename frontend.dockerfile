from node:latest

add ./frontend /frontend

workdir /frontend

run npm install

run npm run build

WORKDIR /frontend/build

cmd python -m SimpleHTTPServer 8000
