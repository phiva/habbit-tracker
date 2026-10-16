# ============================================================
#  Habit Tracker — Dockerfile
#  Serve os arquivos estáticos com Nginx (Alpine)
# ============================================================

FROM nginx:1.27-alpine

# Remove a configuração padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos para o diretório do Nginx
COPY index.html  /usr/share/nginx/html/index.html
COPY style.css   /usr/share/nginx/html/style.css
COPY app.js      /usr/share/nginx/html/app.js

# Configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]
