# Running mahdiyar.me

The site is static files in `public/`, served by the edge Caddy on `ubuntu@37.32.27.201`
(container `padelyar-caddy`, which also fronts tablo.gold, optiflow.studio and padelyar).

## Publishing

Push to `master`. Within 5 minutes the server pulls it and syncs `public/` into
`/srv/mahdiyar-me`. Nothing else to run.

To sync right away:

```bash
ssh -i ~/.ssh/padelyar_deploy ubuntu@37.32.27.201 /opt/mahdiyar-me/server-pull.sh
```

## Server pieces

| Piece | Where |
|---|---|
| Pull script (copy of `ops/server-pull.sh`) | `/opt/mahdiyar-me/server-pull.sh` |
| Cron (user `ubuntu`) | `*/5 * * * * /opt/mahdiyar-me/server-pull.sh >> /opt/mahdiyar-me/pull.log 2>&1` |
| Served directory | `/srv/mahdiyar-me` |
| Caddy mount | `/opt/padelyar/deploy/caddy-compose.yml` → `- /srv/mahdiyar-me:/srv/mahdiyar-me:ro` |
| Caddy routes (mirrored in `ops/Caddyfile.snippet`) | `/opt/padelyar/deploy/caddy/Caddyfile`, end of the `mahdiyar.me` block |

After changing `ops/server-pull.sh`, copy it to the server path above.

## Changing the Caddy routes

`/opt/padelyar/deploy/caddy/` is mounted into the container, so edit it on the host,
validate, then reload — no restart, no downtime. `handle` blocks match in file order;
the Personal Site `handle` is the catch-all and must stay last.

```bash
ssh -i ~/.ssh/padelyar_deploy ubuntu@37.32.27.201
cd /opt/padelyar/deploy
S=$(date +%Y%m%d-%H%M%S); cp caddy/Caddyfile Caddyfile.bak-$S
# edit caddy/Caddyfile, then:
sudo docker exec padelyar-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile \
  && sudo docker exec padelyar-caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
# on failure: cp Caddyfile.bak-$S caddy/Caddyfile
```

Then update `ops/Caddyfile.snippet` here. Keep `/opt/padelyar/deploy/Caddyfile` (an older,
unmounted copy) identical to `caddy/Caddyfile`.

Changing the compose file (e.g. a new mount) needs a container recreate, which briefly
takes down every site behind this Caddy:

```bash
cd /opt/padelyar
sudo docker compose -f docker-compose.yml -f deploy/caddy-compose.yml up -d --no-deps caddy
sudo docker inspect padelyar-caddy --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
# must list tablo-edge, or tablo.gold goes down
```

## TLS certificate

Caddy serves the `mahdiyar.me` certificate from files (`tls /certs/live/mahdiyar.me/...`);
certbot on the host renews them (`certbot.timer`, from 30 days before expiry).

- **Challenge:** HTTP-01 via webroot `/srv/mahdiyar-me` — certbot drops a file in
  `.well-known/acme-challenge/` and Caddy's catch-all serves it. That is why
  `server-pull.sh` excludes `/.well-known/` from `rsync --delete`.
  (The original DNS-01 setup used a Cloudflare token that expired on 2026-07-31;
  `/root/.secrets/cloudflare.ini` is dead.)
- **After renewal:** `/etc/letsencrypt/renewal-hooks/deploy/restart-caddy.sh` restarts
  `padelyar-caddy` so it loads the new files — a few seconds of downtime for every site
  behind it, about once every 60 days.
- **Test renewal** (Let's Encrypt staging; changes nothing):

```bash
sudo certbot renew --dry-run --no-random-sleep-on-renew --cert-name mahdiyar.me
```

## Smoke test

```bash
for p in / /blog /blog/ /does-not-exist /padelyar /tldrss/; do
  printf '%-16s ' "$p"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "https://mahdiyar.me$p"
done
# expect: 200, 308 -> /blog/, 200, 404, 308 -> optiflow.studio, 200
```
