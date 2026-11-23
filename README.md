# Casa Pé n’Areia

Site de hospedagem em Caetanos (Amontada, Ceará), feito com Next.js App Router, TypeScript, Tailwind CSS, GSAP/ScrollTrigger, Lenis e Supabase.

## Requisitos

- Node.js 20 ou superior e npm
- Projeto Supabase
- Credenciais de produção do Mercado Pago para ativar checkout

## Rodar localmente

1. Instale as dependências: `npm install`. No Windows PowerShell com execução de scripts restrita, use `npm.cmd install`.
2. Copie `.env.example` para `.env.local` e preencha as credenciais do Supabase. Sem Supabase, o site funciona com dados de demonstração locais; o formulário de reserva informa que o serviço ainda não está configurado.
3. Execute `npm run dev` (ou `npm.cmd run dev` no PowerShell restrito) e abra `http://localhost:3000`.
4. Antes de habilitar reservas, configure `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` e `NEXT_PUBLIC_SITE_URL`.

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com/).
2. Abra **SQL Editor**, execute o conteúdo de `supabase/schema.sql` e confirme que as três acomodações de seed aparecem na tabela `accommodations`.
3. Em **Project Settings → API**, configure a URL e a chave anon em `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Configure a service-role key somente no ambiente de servidor como `SUPABASE_SERVICE_ROLE_KEY`; nunca a exponha com prefixo `NEXT_PUBLIC_`.
4. Crie usuários para a equipe em **Authentication → Users** e atribua `{"role":"admin"}` ao objeto `app_metadata` de cada administrador com a Admin API do Supabase. Alternativamente, no SQL Editor, atribua a claim ao e-mail autorizado: `update auth.users set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb where email = 'admin@exemplo.com';`. O painel, as políticas RLS e uploads exigem essa claim; não coloque a service-role key no navegador. Desative sign-ups públicos se não forem necessários.
5. O SQL cria o bucket público `home-assets`, as políticas de acesso e a função transacional de criação de reserva. A home já usa imagens locais em `public/images/`, recortadas das referências visuais enviadas para este projeto. Você pode substituí-las por fotos originais autorizadas no Storage e salvar os endereços nos campos de imagem.

## Mercado Pago e webhook

O adaptador `PaymentProvider` está em `src/lib/payments.ts`; a implementação padrão usa Preferências do Mercado Pago, com Pix e cartão conforme os métodos habilitados na conta. Configure a URL de notificação como `https://SEU_DOMINIO/api/payments/webhook` e use o segredo de assinatura correspondente em `MERCADOPAGO_WEBHOOK_SECRET`. O webhook confere HMAC antes de consultar o pagamento diretamente na API do Mercado Pago.

O preço é calculado no servidor com o preço-base por noite armazenado na acomodação. Uma reserva pendente segura a data por 30 minutos; depois disso, ela deixa de impedir novas consultas. Personalize regras de temporada, taxas, prazos, textos legais e política de cancelamento antes de processar reservas reais.

## Supabase Storage e conteúdo

O bucket `home-assets` é público para leitura e recebe upload somente de usuários autenticados. As imagens locais atuais são recortes de baixa resolução extraídos das referências visuais enviadas; substitua-as pelos originais em maior resolução quando disponíveis, mantendo os nomes em `public/images/` ou usando os endereços públicos do Storage. Os gradientes CSS são apenas fallback quando uma imagem não está configurada. Os campos JSON `images` de `accommodations` aceitam endereços públicos do bucket.

## Testes locais

- `npm run typecheck`
- `npm run build`
- `npm run start`

## Deploy na Vercel

1. Importe este diretório como projeto Next.js na Vercel.
2. Adicione, em **Settings → Environment Variables**, as variáveis de `.env.example` necessárias ao ambiente. Nunca configure a service-role key como variável pública.
3. Faça deploy e configure `NEXT_PUBLIC_SITE_URL` com o domínio final.
4. Cadastre a URL de webhook de produção no Mercado Pago e confirme o fluxo no ambiente de testes antes de ativar cobranças reais.
5. Configure o domínio `www.casapenareia.com` e verifique sitemap, robots, metadados e consentimento de cookies.

## Checklist antes de publicar

- [ ] Substituir os recortes das referências visuais por fotos originais autorizadas em maior resolução, especialmente da casa, dos chalés, da praia, dos passeios e da gastronomia.
- [ ] Carregar depoimentos reais, somente com autorização, no banco `testimonials`.
- [ ] Revisar com assessoria as políticas de privacidade, reserva e cancelamento.
- [ ] Confirmar valores, comodidades, capacidade e disponibilidade das acomodações.
- [ ] Configurar credenciais e webhook Mercado Pago e realizar pagamentos de teste.
- [ ] Configurar e testar o ID do Meta Pixel somente após consentimento.
- [ ] Confirmar que apenas pessoas autorizadas têm usuário Supabase, pois esses usuários acessam o painel administrativo.
- [ ] Validar contraste, navegação por teclado, reduced motion e telas reais de 360 px, 768 px e 1440 px.
