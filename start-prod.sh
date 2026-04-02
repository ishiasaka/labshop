#! /bin/bash
export SECRET_KEY=f807ea8d699d497b70394ecdb5daee420d953ab072aea113f9411b923fa319ad
docker compose -f docker-compose.prod.yaml up --build -d
