# PDV Marmitaria - Frontend

Sistema completo de Ponto de Venda (PDV) para marmitarias e restaurantes desenvolvido com React 18 + TypeScript + Vite.

## 🚀 Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool super rápido
- **TailwindCSS** - Estilização
- **Shadcn/UI** - Componentes base
- **Framer Motion** - Animações
- **Recharts** - Gráficos
- **Zustand** - Gerenciamento de estado
- **React Router** - Roteamento
- **Axios** - Requisições HTTP
- **React Hook Form** - Formulários
- **Zod** - Validação
- **date-fns** - Manipulação de datas
- **Sonner** - Notificações toast

## 🎨 Temas

### Tema Escuro - "Noite Estrelada" (Padrão)
- Fundo: `#0B1220`
- Painéis: `#0F172A`
- Primário: `#1E3A8A`
- Hover: `#1D4ED8`
- Texto: `#E5E7EB`

### Tema Claro - "Azul Suave"
- Fundo: `#F8FAFC`
- Painéis: `#FFFFFF`
- Primário: `#2563EB`
- Hover: `#1D4ED8`
- Texto: `#0F172A`

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Backend PDV rodando em `http://localhost:5000`

## 🔧 Instalação

1. **Clone o repositório ou extraia o arquivo**

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` se necessário:
```env
VITE_API_URL=http://localhost:5000/api
```

## 🏃 Executando o Projeto

### Modo Desenvolvimento
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

### Build para Produção
```bash
npm run build
```

Os arquivos otimizados estarão na pasta `dist/`

### Preview do Build
```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Button, Input, Card, etc)
│   └── Layout.tsx      # Layout principal com navegação
├── pages/              # Páginas da aplicação
│   ├── LoginPage.tsx   # Tela de login
│   ├── Dashboard.tsx   # Dashboard principal
│   └── PDVPage.tsx     # Ponto de Venda
├── store/              # Estado global (Zustand)
│   ├── authStore.ts    # Autenticação
│   ├── cashStore.ts    # Caixa
│   └── themeStore.ts   # Tema
├── lib/                # Utilitários e configurações
│   ├── api.ts          # Cliente Axios
│   └── utils.ts        # Funções auxiliares
├── types/              # Tipos TypeScript
│   └── index.ts        # Tipos do sistema
├── App.tsx             # Componente raiz
├── main.tsx            # Ponto de entrada
└── index.css           # Estilos globais
```

## 👥 Perfis de Usuário

### Caixa
- Abrir e operar seu caixa
- Realizar vendas
- Consultar estoque
- Ver histórico próprio

### Gerente
- Tudo do perfil Caixa
- Gerenciar produtos
- Registrar despesas
- Fechar caixas
- Gerar relatórios

### Administrador
- Acesso total ao sistema
- Gerenciar usuários
- Configurações do sistema
- Backup e restauração
- Visualizar logs

## ✨ Funcionalidades Implementadas

### ✅ Autenticação
- [x] Login com usuário e senha
- [x] Recuperação de senha com pergunta de segurança
- [x] Troca obrigatória de senha no primeiro acesso
- [x] Logout com fechamento automático de caixa

### ✅ Caixa
- [x] Abertura com saldo inicial
- [x] Controle de sessão ativa
- [x] Indicador visual de caixa aberto
- [x] Fechamento com resumo detalhado

### ✅ PDV (Ponto de Venda)
- [x] Adicionar produtos ao carrinho
- [x] Produto genérico com valor digitável
- [x] Ajustar quantidade de itens
- [x] Remover itens do carrinho
- [x] Cliente opcional (nome e telefone)
- [x] Aplicar descontos (percentual ou fixo)
- [x] Múltiplas formas de pagamento
- [x] Cálculo automático de totais

### ✅ Dashboard
- [x] Cards de estatísticas do dia
- [x] Gráfico de produtos mais vendidos
- [x] Métodos de pagamento utilizados
- [x] Resumo de faturamento e lucro

### ✅ Interface
- [x] Design moderno e limpo
- [x] Tema escuro e claro
- [x] Responsivo para desktop
- [x] Animações suaves com Framer Motion
- [x] Notificações toast
- [x] Navegação por perfil

## 🔌 Integração com Backend

O frontend se comunica com o backend através de:

**Base URL:** `http://localhost:5000/api`

### Principais Endpoints Utilizados

- `POST /auth/login` - Autenticação
- `POST /auth/change-password` - Trocar senha
- `POST /auth/recover-password` - Recuperar senha
- `GET /cash/open` - Buscar caixa aberto
- `POST /cash/open` - Abrir novo caixa
- `POST /cash/:id/close` - Fechar caixa
- `GET /products` - Listar produtos
- `POST /sales` - Criar venda
- `GET /reports/daily` - Relatório diário

## 🎯 Próximas Funcionalidades

Estas funcionalidades serão implementadas nas próximas atualizações:

- [ ] Tela de finalização de pagamento completa
- [ ] Página de gerenciamento de produtos
- [ ] Página de despesas
- [ ] Página de relatórios avançados
- [ ] Página de usuários (admin)
- [ ] Página de configurações
- [ ] Página de logs do sistema
- [ ] Impressão de comprovantes
- [ ] Histórico de vendas
- [ ] Notificações em tempo real
- [ ] Atalhos de teclado (F1-F5, ESC)

## 🐛 Troubleshooting

### O frontend não conecta ao backend
- Verifique se o backend está rodando em `http://localhost:5000`
- Verifique o arquivo `.env` e a variável `VITE_API_URL`
- Verifique o console do navegador para erros de CORS

### Tema não está funcionando
- Limpe o localStorage do navegador
- Recarregue a página com Ctrl+Shift+R

### Erro ao fazer login
- Verifique se o backend está configurado corretamente
- Confira as credenciais no banco de dados
- Verifique os logs do backend

## 📦 Build para Distribuição

Para criar um executável com Tauri (Windows):

1. Instale o Tauri CLI:
```bash
npm install -g @tauri-apps/cli
```

2. Configure o Tauri no projeto (seguir documentação oficial)

3. Build:
```bash
npm run tauri build
```

## 🤝 Contribuindo

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Suporte

Para suporte e dúvidas:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para marmitarias e restaurantes**
