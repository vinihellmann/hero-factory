import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';
import { activeHero } from '@/test/fixtures';
import { createHero, deactivateHero, getHero, listHeroes, setHeroStatus, updateHero } from './api';
import { toHeroInput } from './formatters';

describe('API de heróis', () => {
  it('lista com paginação e busca', async () => {
    let requestedUrl = '';
    server.use(
      http.get('*/api/heroes', ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({
          data: [activeHero],
          pagination: { page: 2, per_page: 10, total: 11, total_pages: 2 },
        });
      }),
    );

    const response = await listHeroes({ page: 2, search: 'Solaris' });
    expect(response.data).toEqual([activeHero]);
    expect(requestedUrl).toContain('page=2');
    expect(requestedUrl).toContain('search=Solaris');
  });

  it('consulta um herói por id', async () => {
    await expect(getHero(activeHero.id)).resolves.toEqual(activeHero);
  });

  it('envia os métodos e corpos esperados nas mutações', async () => {
    const methods: string[] = [];
    const bodies: unknown[] = [];
    server.use(
      http.all('*/api/heroes/*', async ({ request }) => {
        methods.push(request.method);
        bodies.push(request.method === 'DELETE' ? null : await request.json());
        return HttpResponse.json(activeHero);
      }),
      http.post('*/api/heroes', async ({ request }) => {
        methods.push(request.method);
        bodies.push(await request.json());
        return HttpResponse.json(activeHero, { status: 201 });
      }),
    );

    const input = toHeroInput(activeHero);
    await createHero(input);
    await updateHero({ id: activeHero.id, input });
    await deactivateHero(activeHero.id);
    await setHeroStatus({ id: activeHero.id, isActive: true });

    expect(methods).toEqual(['POST', 'PUT', 'DELETE', 'PATCH']);
    expect(bodies).toEqual([input, input, null, { is_active: true }]);
  });
});
