# Базовий образ Node.js
FROM node:18.20.5-alpine

# Встановити рабочу директорію
WORKDIR /app

# Копіювати package.json та package-lock.json
COPY package*.json ./

# Встановити залежності
RUN npm ci --only=production && \
    npm install nodemailer

# Копіювати весь код програми
COPY . .

# Встановити порт
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Запустити застосунок
CMD ["npm", "start"]
