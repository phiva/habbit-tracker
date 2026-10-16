# 🎯 Habit Tracker

Aplicação de acompanhamento de hábitos diários. Construída com HTML, CSS e JavaScript puro — sem dependências.

## Funcionalidades

- ✅ Adicionar, editar e remover hábitos
- 🔥 Sequência (streak) de dias consecutivos
- 📊 Estatísticas: total, concluídos hoje, progresso e melhor sequência
- 🗂️ Categorias: Saúde, Mente, Produtividade, Social, Finanças, Outro
- 🔍 Filtros: Todos / Pendentes / Concluídos
- 💾 Dados salvos automaticamente no `localStorage`
- 🌙 Tema escuro

## Rodar localmente

Basta abrir o `index.html` no navegador — não precisa de servidor.

## Rodar com Docker

```bash
# Build da imagem
docker build -t habit-tracker .

# Iniciar o container
docker run -p 5000:5000 habit-tracker
```

Acesse em: [http://localhost:8080](http://localhost:8080)

## Estrutura

```
habit-tracker/
├── index.html      # Estrutura HTML
├── style.css       # Estilos (tema escuro)
├── app.js          # Lógica da aplicação
├── Dockerfile      # Imagem Docker com Nginx Alpine
├── nginx.conf      # Configuração do Nginx
└── .dockerignore
```
