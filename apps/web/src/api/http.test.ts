import { http, HttpResponse } from 'msw';
import { z } from 'zod';

import { apiRequest, ApiClientError, buildApiUrl, getErrorMessage } from './http';
import { server } from '@/test/server';

describe('cliente HTTP', () => {
  it('monta URLs sem duplicar o prefixo /api', () => {
    expect(buildApiUrl('/api/heroes', 'http://localhost:3333')).toBe(
      'http://localhost:3333/api/heroes',
    );
    expect(buildApiUrl('/api/heroes', '/api/')).toBe('/api/heroes');
    expect(buildApiUrl('health', 'http://localhost:3333/')).toBe('http://localhost:3333/health');
  });

  it('valida e retorna uma resposta bem-sucedida', async () => {
    server.use(http.get('*/api/example', () => HttpResponse.json({ value: 'ok' })));
    await expect(apiRequest('/api/example', z.object({ value: z.string() }))).resolves.toEqual({
      value: 'ok',
    });
  });

  it('preserva o erro padronizado retornado pela API', async () => {
    server.use(
      http.post('*/api/example', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Dados inválidos.',
              fields: { name: ['Campo obrigatório'] },
            },
          },
          { status: 400 },
        ),
      ),
    );

    const promise = apiRequest('/api/example', z.object({}), {
      method: 'POST',
      body: JSON.stringify({}),
    });

    await expect(promise).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
      fields: { name: ['Campo obrigatório'] },
    });
  });

  it('converte erro desconhecido e resposta inválida em mensagens seguras', async () => {
    server.use(
      http.get('*/api/error', () => new HttpResponse('falha', { status: 500 })),
      http.get('*/api/invalid', () => HttpResponse.json({ wrong: true })),
    );

    await expect(apiRequest('/api/error', z.object({ value: z.string() }))).rejects.toMatchObject({
      code: 'UNEXPECTED_API_ERROR',
    });
    await expect(apiRequest('/api/invalid', z.object({ value: z.string() }))).rejects.toMatchObject(
      {
        code: 'INVALID_API_RESPONSE',
      },
    );
  });

  it('produz mensagens amigáveis para erros conhecidos e desconhecidos', () => {
    expect(
      getErrorMessage(new ApiClientError('Mensagem da API', { status: 409, code: 'CONFLICT' })),
    ).toBe('Mensagem da API');
    expect(getErrorMessage(new Error('interno'))).toBe(
      'Ocorreu um erro inesperado. Tente novamente.',
    );
  });
});
