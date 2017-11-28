from python:latest

add ./backend/requirements.txt /

run pip install -r requirements.txt

add ./backend /backend

workdir /backend

cmd python start.py


