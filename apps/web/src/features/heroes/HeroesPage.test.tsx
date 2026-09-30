import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';

import { App } from '@/App';
import { server } from '@/test/server';
import { activeHero, inactiveHero } from '@/test/fixtures';

describe('tela de heróis', () => {
  it('mostra heróis ativos e inativos com ações coerentes', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText('Solaris')).toBeInTheDocument();
    expect(screen.getByText('Titã')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ver detalhes de Titã, inativo' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ações de Titã' }));
    expect(screen.queryByRole('dialog', { name: 'Detalhes do herói' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Ativar' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Editar' })).not.toBeInTheDocument();
  });

  it('busca pelo texto digitado após o debounce', async () => {
    const user = userEvent.setup();
    const searches: string[] = [];
    server.use(
      http.get('*/api/heroes', ({ request }) => {
        const search = new URL(request.url).searchParams.get('search') ?? '';
        searches.push(search);
        return HttpResponse.json({
          data: search ? [activeHero] : [activeHero, inactiveHero],
          pagination: {
            page: 1,
            per_page: 10,
            total: search ? 1 : 2,
            total_pages: 1,
          },
        });
      }),
    );

    render(<App />);
    await screen.findByText('Solaris');
    await user.type(screen.getByLabelText('Buscar herói'), 'Sol');

    await waitFor(() => expect(searches).toContain('Sol'));
    expect(screen.getByText('Resultado para “Sol”')).toBeInTheDocument();
  });

  it('mostra a busca sem resultado e permite limpar o filtro', async () => {
    server.use(
      http.get('*/api/heroes', ({ request }) => {
        const search = new URL(request.url).searchParams.get('search') ?? '';
        return HttpResponse.json({
          data: search ? [] : [activeHero],
          pagination: {
            page: 1,
            per_page: 10,
            total: search ? 0 : 1,
            total_pages: search ? 0 : 1,
          },
        });
      }),
    );

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Solaris');
    await user.type(screen.getByLabelText('Buscar herói'), 'desconhecido');

    expect(await screen.findByText('Nenhum herói encontrado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Limpar busca' }));

    expect(await screen.findByText('Solaris')).toBeInTheDocument();
    expect(screen.getByLabelText('Buscar herói')).toHaveValue('');
  });

  it('valida e cria um herói pelo formulário compartilhado', async () => {
    const user = userEvent.setup();
    let listCalls = 0;
    server.use(
      http.get('*/api/heroes', () => {
        listCalls += 1;
        if (listCalls > 1) {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Falha temporária.' } },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          data: [activeHero],
          pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        });
      }),
      http.post('*/api/heroes', async ({ request }) => {
        const input = (await request.json()) as Record<string, string>;
        return HttpResponse.json(
          {
            ...activeHero,
            ...input,
            id: '00000000-0000-4000-8000-000000000099',
            date_of_birth: `${input.date_of_birth} 00:00:00`,
          },
          { status: 201 },
        );
      }),
    );

    render(<App />);
    await screen.findByText('Solaris');
    await user.click(screen.getByRole('button', { name: 'Criar herói' }));

    const dialog = screen.getByRole('dialog', { name: /Criar herói/ });
    await user.click(within(dialog).getByRole('button', { name: 'Criar herói' }));
    expect(await within(dialog).findAllByText('Campo obrigatório')).not.toHaveLength(0);

    await user.type(within(dialog).getByLabelText('Nome'), 'Lia Vento');
    await user.type(within(dialog).getByLabelText('Apelido'), 'Vendaval');
    await user.type(within(dialog).getByLabelText('Data de nascimento'), '1993-05-10');
    await user.type(within(dialog).getByLabelText('Universo'), 'Aurora');
    await user.type(within(dialog).getByLabelText('Poder principal'), 'Controle do vento');
    await user.type(
      within(dialog).getByLabelText('URL do avatar'),
      'https://images.hero-factory.test/vendaval.svg',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Criar herói' }));

    expect(
      await screen.findByText('Herói criado com sucesso.', {}, { timeout: 4_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Vendaval')).toBeInTheDocument();
  });

  it('expõe uma ação para tentar novamente quando a lista falha', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/heroes', () => {
        calls += 1;
        if (calls <= 2) {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Falha temporária.' } },
            { status: 500 },
          );
        }
        return HttpResponse.json({
          data: [activeHero],
          pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        });
      }),
    );

    render(<App />);
    await screen.findByText('Não foi possível carregar os heróis', {}, { timeout: 3_000 });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Solaris')).toBeInTheDocument();
  });

  it('mantém os dados anteriores e avisa quando uma atualização falha', async () => {
    let listCalls = 0;
    server.use(
      http.get('*/api/heroes', () => {
        listCalls += 1;
        if (listCalls > 1) {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Falha temporária.' } },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          data: [activeHero],
          pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        });
      }),
      http.delete('*/api/heroes/:id', () => HttpResponse.json({ ...activeHero, is_active: false })),
    );

    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('Solaris');
    await user.click(screen.getByRole('button', { name: 'Ações de Solaris' }));
    await user.click(screen.getByRole('menuitem', { name: 'Excluir' }));
    await user.click(
      within(screen.getByRole('dialog', { name: 'Excluir herói?' })).getByRole('button', {
        name: 'Excluir',
      }),
    );

    expect(
      await screen.findByText(/A lista pode estar desatualizada/, {}, { timeout: 4_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Solaris')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Ver detalhes de Solaris, inativo' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it('mostra carregamento e o estado de coleção vazia', async () => {
    server.use(
      http.get('*/api/heroes', async () => {
        await delay(80);
        return HttpResponse.json({
          data: [],
          pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 },
        });
      }),
    );

    render(<App />);

    expect(screen.getByLabelText('Carregando heróis')).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByText('Sua fábrica está vazia')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Criar primeiro herói' }));
    expect(screen.getByRole('dialog', { name: /Criar herói/ })).toBeInTheDocument();
  });

  it('abre os detalhes e edita um herói ativo', async () => {
    const user = userEvent.setup();
    let listCalls = 0;
    server.use(
      http.get('*/api/heroes', () => {
        listCalls += 1;
        if (listCalls > 1) {
          return HttpResponse.json(
            { error: { code: 'INTERNAL_ERROR', message: 'Falha temporária.' } },
            { status: 500 },
          );
        }

        return HttpResponse.json({
          data: [activeHero],
          pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        });
      }),
      http.put('*/api/heroes/:id', async ({ request }) => {
        const input = (await request.json()) as Record<string, string>;
        return HttpResponse.json({
          ...activeHero,
          ...input,
          date_of_birth: `${input.date_of_birth} 00:00:00`,
          updated_at: '2026-09-29 18:10:00',
        });
      }),
    );

    render(<App />);
    await screen.findByText('Solaris');

    await user.click(screen.getByRole('button', { name: 'Ver detalhes de Solaris' }));
    const details = await screen.findByRole('dialog', { name: 'Detalhes do herói' });
    expect(within(details).getByText('Manipulação da luz')).toBeInTheDocument();
    await user.click(within(details).getByRole('button', { name: 'Fechar' }));
    await waitFor(() => expect(details).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Ações de Solaris' }));
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }));
    const editDialog = screen.getByRole('dialog', { name: /Editar herói/ });
    const powerInput = within(editDialog).getByLabelText('Poder principal');
    await user.clear(powerInput);
    await user.type(powerInput, 'Luz estelar');
    await user.click(within(editDialog).getByRole('button', { name: 'Salvar alterações' }));

    expect(
      await screen.findByText('Herói atualizado com sucesso.', {}, { timeout: 4_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Luz estelar')).toBeInTheDocument();
  });

  it('confirma a inativação e a reativação de um herói', async () => {
    const user = userEvent.setup();
    let hero = { ...activeHero };
    server.use(
      http.get('*/api/heroes', () =>
        HttpResponse.json({
          data: [hero],
          pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
        }),
      ),
      http.delete('*/api/heroes/:id', () => {
        hero = { ...hero, is_active: false };
        return HttpResponse.json(hero);
      }),
      http.patch('*/api/heroes/:id/status', async ({ request }) => {
        const body = (await request.json()) as { is_active: boolean };
        hero = { ...hero, is_active: body.is_active };
        return HttpResponse.json(hero);
      }),
    );

    render(<App />);
    await screen.findByText('Solaris');

    await user.click(screen.getByRole('button', { name: 'Ações de Solaris' }));
    await user.click(screen.getByRole('menuitem', { name: 'Excluir' }));
    const deleteDialog = screen.getByRole('dialog', { name: 'Excluir herói?' });
    await user.click(within(deleteDialog).getByRole('button', { name: 'Excluir' }));
    expect(await screen.findByText('Herói excluído e mantido como inativo.')).toBeInTheDocument();
    await waitFor(() => expect(deleteDialog).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Ações de Solaris' }));
    await user.click(screen.getByRole('menuitem', { name: 'Ativar' }));
    const activateDialog = screen.getByRole('dialog', { name: 'Ativar herói?' });
    await user.click(within(activateDialog).getByRole('button', { name: 'Ativar' }));
    expect(await screen.findByText('Herói ativado com sucesso.')).toBeInTheDocument();
  });

  it('navega entre páginas retornadas pela API', async () => {
    const requestedPages: string[] = [];
    server.use(
      http.get('*/api/heroes', ({ request }) => {
        const requestedPage = new URL(request.url).searchParams.get('page') ?? '1';
        requestedPages.push(requestedPage);
        return HttpResponse.json({
          data: requestedPage === '2' ? [inactiveHero] : [activeHero],
          pagination: { page: Number(requestedPage), per_page: 10, total: 12, total_pages: 2 },
        });
      }),
    );

    render(<App />);
    await screen.findByText('Solaris');
    const user = userEvent.setup();
    const navigation = screen.getByRole('navigation', { name: 'Paginação de heróis' });
    await user.click(within(navigation).getByRole('button', { name: /page 2/i }));

    expect(await screen.findByText('Titã')).toBeInTheDocument();
    expect(requestedPages).toContain('2');
  });
});
