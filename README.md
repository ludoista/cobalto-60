# Cobalto-60

Plataforma de utilitários dinâmicos para estudantes de Ciência da Computação (UFPel). 

## Visão Geral
O Cobalto-60 é um sistema web desenvolvido para fornecer ferramentas ágeis e escaláveis que suprem as limitações de interatividade do sistema institucional padrão. O projeto foi estruturado de forma modular para suportar a adição contínua de novas funcionalidades acadêmicas. O módulo inicial em produção é o Calendário Acadêmico Comunitário.

## Módulo Atual: Calendário Comunitário
Um sistema CRUD para gerenciamento e visualização de datas importantes (provas, trabalhos, dias sem aula), centralizando as informações do semestre.

### Características Técnicas
*   **Renderização de Interface:** Utiliza FullCalendar.js para manipulação do DOM e renderização da grade mensal/anual. As filtragens de categorias ocorrem em memória no cliente, sem requisições adicionais ao banco.
*   **Autenticação:** Gerenciada via Supabase Auth (GoTrue). O acesso é restrito para operações de escrita.
*   **Autorização e Segurança:** Implementada via Row Level Security (RLS) no PostgreSQL. 
    *   `SELECT`: Público.
    *   `INSERT`: Restrito a usuários com token JWT válido.
    *   `UPDATE` / `DELETE`: Restrito ao ID do usuário (`auth.uid()`) que criou o registro.

## Stack Tecnológica
*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+). Arquitetura *zero-build* (sem bundlers).
*   **Backend / Database:** Supabase (PostgreSQL).
*   **Dependências (CDN):** FullCalendar 6.1.15, Supabase JS Client v2.

## Estrutura de Dados
Tabela principal: `eventos`
*   `id` (uuid, primary key)
*   `titulo` (text)
*   `tipo` (text) - Valores aceitos: *prova, trabalho, sem-aula, evento*
*   `data` (date)
*   `horario` (time, nullable)
*   `lugar` (text, nullable)
*   `autor_nome` (text)
*   `author_id` (uuid, foreign key ref auth.users)

## Instruções de Execução Local

1. Clone o repositório:
```bash
git clone [https://github.com/SEU_USUARIO/cobalto-60.git](https://github.com/SEU_USUARIO/cobalto-60.git)
```

2. Sirva o diretório raiz através de um servidor HTTP estático (necessário para o funcionamento adequado do módulo de autenticação do Supabase).
   * Exemplo com Python:
     ```bash
     python -m http.server 8000
     ```
   * Exemplo com Node/NPM:
     ```bash
     npx serve .
     ```

3. Acesse `http://localhost:8000`.

*Nota:* As credenciais públicas (`anon key` e `url`) já estão configuradas no arquivo `app.js` para comunicação com a base de desenvolvimento.

## Escalabilidade e Próximos Módulos
A infraestrutura atual de banco de dados e controle de sessão serve como base para a plataforma. Novos recursos serão integrados no repositório como módulos paralelos ao calendário, reaproveitando o cliente de conexão do Supabase e o layout container principal.
