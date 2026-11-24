# bacbo-astra

Criar a plataforma BAC BO ASTRA inspirada nas imagens de referência, mobile-first, com tema dark escuro (preto/grafite com detalhes em azul elétrico e vermelho vivo, SEM cor roxa e SEM cor dourada), tipografia forte em negrito e layout limpo.

Funcionalidades da plataforma:
1. Autenticação & Segurança (Lovable Cloud / Supabase):
   - Cadastro e login de usuários.
   - Aprovação obrigatória pelo Administrador: usuário cadastrado fica com status 'pendente' e só acessa a tela de sinais após aprovação no painel ADM.
   - Bloqueio de multi-dispositivo (apenas 1 sessão ativa por usuário).
   - A senha do administrador é definida no primeiro login do ADM.

2. Dashboard Principal de Sinais:
   - Radar animado com status em tempo real: 'ANALISANDO' vs 'ENTRADA CONFIRMADA' (JOGADOR, CASA ou EMPATE).
   - Cards luminosos com porcentagens para Jogador, Empate e Casa.
   - Respeitar o ciclo do Bac Bo Live com contagem regressiva da janela de apostas (cerca de 15 segundos).
   - O botão 'Entrar no Jogo' direciona para a Elephant Bet Angola e SÓ APARECE quando uma entrada for confirmada.
   - Histórico detalhado de assertividade com horários, tipo de entrada e taxa de acerto destacada (ex: 93.3% WIN), conforme o estilo da imagem 4.
   - ASTRA Assistente: chat de suporte onde o usuário manda mensagem, recebe resposta automática imediata e o ticket cai no ADM para resposta.
   - Sino de Notificações (🔔) no topo para exibir comunicados enviados pelo ADM.
   - Usuários comuns não veem fontes de API ou termos técnicos (experiência 100% blindada).

3. Painel Administrativo (/admin restrito):
   - Gestão de Usuários: lista com nome, e-mail, data e botões para Aprovar, Bloquear ou Recusar acesso.
   - Gestão da API & Robô: interruptor mestre para Ligar/Desligar o robô de sinais, e campo para configurar a chave/endpoint da API da Lynxmetrics (com simulação matemática automática caso a API não esteja preenchida).
   - Integração Telegram: configuração de Bot Token e Chat ID, personalização de templates de mensagens com emojis e preview ao vivo da mensagem formatada.
   - Central de Avisos: criação e envio de notificações para o sino de alertas de todos os usuários.
   - Suporte: painel para responder aos chamados abertos no ASTRA Assistente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a1236b1-eb07-4601-9d9e-1bee0541925b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
