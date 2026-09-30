import type { ApiError } from '@hero-factory/contracts';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { ApplicationError } from '../domain/errors.js';

interface ValidationItem {
  instancePath?: string;
  message?: string;
  params?: { missingProperty?: string };
}

interface RequestError extends Error {
  statusCode?: number;
  validation?: ValidationItem[];
}

function asRequestError(error: unknown): RequestError {
  return error instanceof Error ? error : new Error(String(error));
}

function validationFields(error: RequestError): Record<string, string[]> | undefined {
  const validation = error.validation;
  if (validation === undefined) return undefined;

  const fields: Record<string, string[]> = {};

  for (const issue of validation) {
    const pathFromInstance = issue.instancePath?.replace(/^\//, '').replaceAll('/', '.');
    const field = pathFromInstance || issue.params?.missingProperty || 'request';
    const message = issue.message ?? 'Valor inválido';
    fields[field] = [...(fields[field] ?? []), message];
  }

  return Object.keys(fields).length === 0 ? undefined : fields;
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  fields?: Record<string, string[]>,
) {
  const payload: ApiError =
    fields === undefined ? { error: { code, message } } : { error: { code, message, fields } };

  return reply.code(statusCode).send(payload);
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setNotFoundHandler((_request, reply) =>
    sendError(reply, 404, 'ROUTE_NOT_FOUND', 'Rota não encontrada.'),
  );

  app.setErrorHandler((error, request: FastifyRequest, reply) => {
    if (error instanceof ApplicationError) {
      return sendError(reply, error.statusCode, error.code, error.message);
    }

    const requestError = asRequestError(error);

    if (requestError.validation !== undefined) {
      return sendError(
        reply,
        400,
        'VALIDATION_ERROR',
        'Os dados enviados são inválidos.',
        validationFields(requestError),
      );
    }

    if (
      requestError.statusCode !== undefined &&
      requestError.statusCode >= 400 &&
      requestError.statusCode < 500
    ) {
      return sendError(reply, requestError.statusCode, 'REQUEST_ERROR', requestError.message);
    }

    request.log.error({ err: error }, 'Erro inesperado ao processar a requisição');
    return sendError(reply, 500, 'INTERNAL_ERROR', 'Ocorreu um erro interno inesperado.');
  });
}
