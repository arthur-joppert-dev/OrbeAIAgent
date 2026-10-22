# Orbe

Interface React para conversar com o assistente da API Flask.

## Executar localmente

Na raiz do projeto, instale as dependências do backend e configure a chave do Groq:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Crie um arquivo `.env` na raiz com `GROQ_API_KEY=sua_chave`. Opcionalmente, defina
`GROQ_MODEL` para escolher outro modelo disponível na sua conta Groq.

Inicie a API:

```bash
python -m backend.main
```

Em outro terminal, inicie o frontend:

```bash
cd frontend
npm install
npm run dev
```

O frontend usa `http://localhost:3000` como endereço da API. Para usar outro
endereço, crie `frontend/.env.local` com `VITE_API_URL=https://sua-api`.

## Rotas da API

- `GET /health`: verifica se a API está ativa.
- `POST /register`: recebe `username`, `email` e `password`.
- `POST /login`: recebe `username` e `password`.
- `POST /ask`: recebe `user`, `password` e `question`.
- `DELETE /delete`: recebe `username` e `password`.

As rotas que recebem dados esperam JSON. Senhas são armazenadas com hash.
