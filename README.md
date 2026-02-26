# labshop

## Author
- Rintaro Kanaji
- Sila Sonpee (Ishikawa)
- Suzuka Yoshimoto
- Ayobami Joseph
- Sadio Bah

## Start production
1. Assign the secret key in start-prod.sh (example in start-prod.sh, copy and rename it)
2. Run this command
```bash
$ ./start-prod.sh
```

## Stop
```bash
$ docker compose -f docker-compose.prod.yaml down
```