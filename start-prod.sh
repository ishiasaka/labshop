#! /bin/bash
export SECRET_KEY="4bbbedda03313180226144d9882742f4356637813fb45ee8e056760555608da9"
docker compose -f docker-compose.prod.yaml up --build -d