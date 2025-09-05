FROM nginx:alpine

# Copy build output
COPY dist/ /usr/share/nginx/html/

# Copy runtime config template and entrypoint
COPY public/config.json.template /usr/share/nginx/html/config.json.template
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Ensure /config.json is never cached by the browser/CDN
RUN printf '\nlocation = /config.json { add_header Cache-Control "no-store"; }\n' \
  >> /etc/nginx/conf.d/default.conf

# Generate /config.json on startup from $API_BASE_URL
ENTRYPOINT ["/entrypoint.sh"]
