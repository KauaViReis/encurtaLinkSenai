# Encurtador de Links SENAI

Aplicação completa de encurtador de links utilizando React, Vite, Tailwind CSS v4, e Firebase (Auth e Firestore). O sistema apresenta um design moderno estilo Glassmorphism, temas claro/escuro nativos do Tailwind, e roteamento para redirecionamento.

## 🚀 Como Rodar o Projeto

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configuração do Firebase:**
   Renomeie o arquivo `.env.example` para `.env.local` e certifique-se de que as chaves da API do Firebase geradas anteriormente estão corretas. (Um arquivo `.env.local` já foi gerado e pré-preenchido para você).

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

## 🔒 Regras de Segurança do Firestore

Para que o redirecionamento e as listagens funcionem corretamente de forma segura, acesse o Console do Firebase -> Firestore Database -> Rules e cole as regras contidas no arquivo `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /links/{linkId} {
      allow read: if true; 
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if true; 
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🛠️ Tecnologias Utilizadas
- React 18
- Vite
- Tailwind CSS v4
- Firebase (Authentication, Firestore)
- React Router DOM
- i18next (Internacionalização PT, EN, ES)
- Lucide React (Ícones)
