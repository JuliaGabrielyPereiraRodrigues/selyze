
<div align="center">

# 🍱 Selyze PDV

### Sistema de Ponto de Venda e Gestão para Marmitarias

**Uma solução de gestão comercial que integra vendas, controle de caixa, produtos, estoque e relatórios em uma única aplicação.**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

[Sobre](#-sobre-o-projeto) •
[Funcionalidades](#-funcionalidades) •
[Tecnologias](#-tecnologias-utilizadas) •
[Instalação](#-instalação-e-execução) •
[Estrutura](#-estrutura-do-projeto)

</div>

---

## 📖 Sobre o projeto

O **Selyze PDV** é uma aplicação full stack desenvolvida para auxiliar na gestão de operações comerciais de marmitarias e pequenos estabelecimentos alimentícios.

O sistema centraliza atividades como registro de vendas, gerenciamento de produtos, controle de estoque, movimentação financeira, administração de usuários e emissão de relatórios.

A aplicação foi estruturada com **React e TypeScript no front-end**, **Node.js e Express no back-end** e **SQLite para persistência dos dados**.

### 🎯 Objetivos

- Centralizar as operações de um ponto de venda.
- Facilitar o registro e acompanhamento de vendas.
- Automatizar cálculos financeiros.
- Gerenciar produtos e movimentações de estoque.
- Organizar os processos de abertura e fechamento de caixa.
- Oferecer relatórios para acompanhamento do estabelecimento.
- Aplicar conceitos de desenvolvimento de software full stack.

---

## ✨ Funcionalidades

### 🛒 Ponto de venda (PDV)

O módulo de vendas permite gerenciar operações comerciais por meio de uma interface dedicada.

- Seleção de produtos.
- Adição e remoção de itens da venda.
- Gerenciamento de quantidades.
- Cálculo dos valores da compra.
- Registro das formas de pagamento.
- Finalização de vendas.
- Consulta de registros de vendas.
- Geração de comprovantes.

### 🍱 Gerenciamento de produtos

- Cadastro de produtos.
- Edição de informações.
- Organização por categorias.
- Definição de preços.
- Controle de produtos ativos e inativos.
- Gerenciamento de quantidades em estoque.
- Configuração de estoque mínimo.
- Identificação de produtos com estoque baixo.

### 💰 Controle de caixa

- Abertura de caixa.
- Registro do saldo inicial.
- Associação das vendas à sessão de caixa.
- Registro de despesas.
- Consulta de movimentações financeiras.
- Fechamento de caixa.
- Resumo das operações realizadas.
- Consulta ao histórico de caixas.

### 📊 Dashboard e relatórios

O sistema possui um painel de acompanhamento e módulos de relatórios financeiros.

Entre os recursos presentes no código estão:

- Dashboard com indicadores operacionais.
- Relatórios diários.
- Relatórios semanais.
- Relatórios mensais.
- Consulta de vendas por período.
- Análise de movimentações financeiras.
- Exportação de informações em CSV.
- Geração de documentos PDF.
- Visualização de dados por meio de gráficos.

### 👥 Gerenciamento de usuários

O sistema utiliza autenticação e diferentes níveis de acesso.

| Perfil | Responsabilidade |
|:---|:---|
| **Administrador** | Gerenciamento geral do sistema e usuários |
| **Gerente** | Acompanhamento operacional e gerenciamento de produtos |
| **Caixa** | Operações de vendas e movimentações do caixa |

O controle de permissões utiliza autenticação por JWT e verificações de autorização nas rotas da API.

### ⚙️ Configurações e administração

- Gerenciamento de configurações do sistema.
- Consulta de logs de auditoria.
- Notificações operacionais.
- Configuração de informações do estabelecimento.
- Recursos para geração de backups.
- Controle de acesso por perfil.

### 🎨 Interface e experiência do usuário

- Layout organizado por módulos.
- Componentes reutilizáveis.
- Navegação entre páginas.
- Temas claro e escuro.
- Modais para operações e formulários.
- Notificações visuais.
- Gráficos e indicadores.
- Interface desenvolvida com Tailwind CSS.

---

## 🛠️ Tecnologias utilizadas

### Front-end

| Tecnologia | Finalidade |
|:---|:---|
| **React 18** | Construção da interface |
| **TypeScript** | Tipagem estática |
| **Vite** | Ambiente de desenvolvimento |
| **Tailwind CSS** | Estilização |
| **React Router** | Navegação entre páginas |
| **Zustand** | Gerenciamento de estado |
| **Axios** | Comunicação com a API |
| **Framer Motion** | Animações |
| **Recharts** | Gráficos e indicadores |
| **React Hook Form** | Gerenciamento de formulários |
| **Zod** | Validação de dados |
| **Sonner** | Notificações |
| **Lucide React** | Ícones |

### Back-end

| Tecnologia | Finalidade |
|:---|:---|
| **Node.js** | Ambiente de execução |
| **TypeScript** | Desenvolvimento da API |
| **Express** | Servidor HTTP e rotas |
| **SQLite** | Banco de dados relacional |
| **JWT** | Autenticação |
| **bcryptjs** | Hash de senhas |
| **PDFKit** | Geração de documentos PDF |
| **Archiver** | Criação de arquivos ZIP |
| **Multer** | Upload de arquivos |
| **Nodemailer** | Recursos de envio de e-mails |
| **Helmet** | Configuração de cabeçalhos de segurança |

---

## 🏗️ Arquitetura da aplicação

O sistema utiliza uma arquitetura cliente-servidor, com separação entre apresentação, API, regras de negócio e persistência.

```text
                    ┌──────────────────┐
                    │     USUÁRIO      │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     FRONT-END    │
                    │ React/TypeScript │
                    │   Vite/Tailwind  │
                    └────────┬─────────┘
                             │
                      Requisições HTTP
                             │
                             ▼
                    ┌──────────────────┐
                    │     BACK-END     │
                    │ Node.js/Express  │
                    └────────┬─────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
               ▼                           ▼
      ┌─────────────────┐       ┌─────────────────┐
      │    SERVICES     │       │  AUTENTICAÇÃO   │
      │ Regras de       │       │ JWT e níveis    │
      │ negócio         │       │ de acesso       │
      └────────┬────────┘       └─────────────────┘
               │
               ▼
      ┌─────────────────┐
      │     SQLite      │
      │ Persistência    │
      │ dos dados       │
      └─────────────────┘
```

### Organização do back-end

A implementação separa responsabilidades em:

- **Controllers:** recebimento das requisições e respostas HTTP.
- **Services:** regras de negócio.
- **Routes:** definição dos endpoints.
- **Middleware:** autenticação, auditoria e tratamento de erros.
- **Database:** conexão, estrutura e inicialização do banco.
- **Utils:** funcionalidades auxiliares, incluindo PDF e backup.

---

## 📁 Estrutura do projeto

```text
selyze/
│
└── selyze-pdv-corrigido-completo (1)/
    │
    ├── front/
    │   ├── public/
    │   ├── src/
    │   │   ├── api/
    │   │   ├── components/
    │   │   │   ├── modals/
    │   │   │   └── ui/
    │   │   ├── hooks/
    │   │   ├── lib/
    │   │   ├── pages/
    │   │   ├── store/
    │   │   ├── types/
    │   │   ├── App.tsx
    │   │   └── main.tsx
    │   │
    │   ├── package.json
    │   ├── vite.config.ts
    │   └── tailwind.config.js
    │
    └── backend/
        ├── src-backend/
        │   ├── controllers/
        │   ├── db/
        │   │   ├── migrations/
        │   │   ├── connection.ts
        │   │   ├── schema.sql
        │   │   └── seed.ts
        │   ├── middleware/
        │   ├── routes/
        │   ├── services/
        │   ├── types/
        │   ├── utils/
        │   ├── app.ts
        │   └── server.ts
        │
        ├── package.json
        ├── nodemon.json
        └── tsconfig.json
```

> A estrutura acima representa a organização encontrada no repositório. Algumas configurações ainda apontam para caminhos antigos e precisam ser ajustadas.

---

## 🚀 Instalação e execução

### Pré-requisitos

Para executar o projeto localmente, são necessários:

- Node.js e npm.
- Git para clonar o repositório.
- Ambiente compatível com SQLite e suas dependências nativas.

### 1. Clone o repositório

```bash
git clone https://github.com/JuliaGabrielyPereiraRodrigues/selyze.git
cd selyze
```

Acesse o diretório da aplicação:

```bash
cd "selyze-pdv-corrigido-completo (1)"
```

### 2. Instale as dependências do back-end

```bash
cd backend
npm install
```

### 3. Configure o ambiente

Crie um arquivo `.env` dentro de `backend/`:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=substitua_por_uma_chave_secreta_forte
```

Utilize uma chave segura e não publique o arquivo `.env` no repositório.

### 4. Inicie o back-end

Após corrigir os caminhos:

```bash
npm run dev
```

A porta de execução deve ser configurada como `3000`, pois o front-end utiliza esse endereço para acessar a API.

A rota de verificação de funcionamento está definida em:

```text
http://localhost:3000/api/health
```

### 5. Instale as dependências do front-end

Abra outro terminal e acesse a pasta `front/`, dentro do diretório principal da aplicação.

```bash
cd front
npm install
```

### 6. Inicie o front-end

```bash
npm run dev
```

O Vite está configurado para disponibilizar a aplicação em:

```text
http://localhost:5173
```

O arquivo `vite.config.ts` também configura o encaminhamento de requisições `/api` para o servidor na porta `3000`.

> **Importante:** o funcionamento completo ainda depende da correção das configurações e da validação das dependências. Os comandos documentam o fluxo previsto pelo projeto, não uma instalação integralmente testada.

---

## 🔗 Principais endpoints da API

A API utiliza o prefixo `/api`.

| Método | Endpoint | Finalidade |
|:---|:---|:---|
| `GET` | `/health` | Verificar o estado da API |
| `POST` | `/auth/login` | Autenticar usuário |
| `GET` | `/users` | Consultar usuários |
| `GET` | `/products` | Listar produtos |
| `POST` | `/products` | Cadastrar produto |
| `POST` | `/cash/open` | Abrir caixa |
| `POST` | `/cash/:id/close` | Fechar caixa |
| `POST` | `/sales` | Registrar venda |
| `GET` | `/sales/:id` | Consultar venda |
| `GET` | `/expenses` | Consultar despesas |
| `GET` | `/reports/daily` | Relatório diário |
| `GET` | `/reports/weekly` | Relatório semanal |
| `GET` | `/reports/monthly` | Relatório mensal |
| `GET` | `/notifications` | Consultar notificações |
| `GET` | `/settings` | Consultar configurações |
| `GET` | `/logs` | Consultar registros de auditoria |

A maior parte das rotas exige autenticação. Algumas operações também dependem das permissões do usuário.

---

## 🔐 Autenticação e segurança

O código inclui recursos voltados à proteção e ao gerenciamento de acesso à aplicação:

- Autenticação utilizando JWT.
- Armazenamento de senhas com hash.
- Controle de permissões por perfil.
- Middleware de autenticação.
- Registro de operações de auditoria.
- Configuração de CORS.
- Cabeçalhos de segurança com Helmet.
- Tratamento centralizado de erros.

Esses recursos representam mecanismos implementados no projeto e não substituem uma auditoria de segurança.

O sistema deve passar por testes e revisão antes de ser disponibilizado em produção.

---

## 📚 Aprendizados

O desenvolvimento do Selyze envolve conceitos de:

- Desenvolvimento web full stack.
- Arquitetura cliente-servidor.
- Componentização com React.
- Desenvolvimento com TypeScript.
- Gerenciamento de estado com Zustand.
- Construção e consumo de APIs REST.
- Organização de regras de negócio.
- Modelagem de banco de dados relacional.
- Autenticação e autorização.
- Gestão de vendas e operações financeiras.
- Criação de dashboards.
- Geração de relatórios e documentos.
- Organização e manutenção de código.

---

## 🔮 Possíveis melhorias

- Corrigir e padronizar os caminhos do back-end.
- Reorganizar os diretórios principais do repositório.
- Implementar testes automatizados de integração.
- Melhorar a documentação dos endpoints da API.
- Criar um ambiente de demonstração com dados fictícios.
- Adicionar capturas de tela das principais interfaces.
- Revisar os fluxos de autenticação e recuperação de senha.
- Automatizar procedimentos de instalação e configuração.
- Implementar rotinas de integração contínua.
- Ampliar a cobertura de validações no front-end e no back-end.

---

## 📌 Contexto do projeto

O **Selyze PDV** é um projeto de desenvolvimento de software voltado à aplicação de conhecimentos de sistemas comerciais, arquitetura full stack e gerenciamento de dados.

A aplicação foi concebida para representar operações de ponto de venda em marmitarias e pequenos estabelecimentos alimentícios.

O repositório apresenta a implementação do sistema e seus módulos, mas ainda necessita de ajustes e validação antes de uso operacional.

---

## 👩‍💻 Autoria

Projeto disponibilizado por **[Julia Gabriely](https://github.com/JuliaGabrielyPereiraRodrigues)** como parte de seu portfólio de desenvolvimento de software.

<div align="center">

---

**[⬆ Voltar ao topo](#-selyze-pdv)**

</div>
