# Imagem leve do Node
FROM node:18-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todo o código da aplicação
COPY . .

# Expõe a porta
EXPOSE 7070

# Comando para iniciar o servidor
CMD ["npm", "start"]
