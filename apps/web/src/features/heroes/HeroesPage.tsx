import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  HEROES_PER_PAGE,
  type Hero,
  type HeroInput,
  type HeroListResponse,
} from '@hero-factory/contracts';
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  LinearProgress,
  Pagination,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  type AlertColor,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

import { getErrorMessage } from '@/api/http';
import { createHero, deactivateHero, heroKeys, listHeroes, setHeroStatus, updateHero } from './api';
import { ConfirmActionDialog } from './components/ConfirmActionDialog';
import { EmptyState, ErrorState } from './components/FeedbackState';
import { HeroCard } from './components/HeroCard';
import { HeroDetailsDialog } from './components/HeroDetailsDialog';
import { HeroFormDialog } from './components/HeroFormDialog';
import { HeroGridSkeleton } from './components/HeroGridSkeleton';
import { useDebouncedValue } from './hooks/useDebouncedValue';

type FormState = { mode: 'create' } | { mode: 'edit'; hero: Hero } | null;
type ConfirmationState = { action: 'deactivate' | 'activate'; hero: Hero } | null;
type ToastState = { message: string; severity: AlertColor } | null;

export function HeroesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  const heroesQuery = useQuery({
    queryKey: heroKeys.list(page, debouncedSearch),
    queryFn: ({ signal }) => listHeroes({ page, search: debouncedSearch }, signal),
    placeholderData: keepPreviousData,
  });

  function replaceHeroInCachedLists(hero: Hero) {
    queryClient.setQueriesData<HeroListResponse>({ queryKey: heroKeys.lists() }, (current) =>
      current
        ? {
            ...current,
            data: current.data.map((item) => (item.id === hero.id ? hero : item)),
          }
        : current,
    );
  }

  const createMutation = useMutation({
    mutationFn: createHero,
    onSuccess: async (hero) => {
      queryClient.setQueryData<HeroListResponse>(heroKeys.list(1, ''), (current) => {
        if (!current) {
          return {
            data: [hero],
            pagination: {
              page: 1,
              per_page: HEROES_PER_PAGE,
              total: 1,
              total_pages: 1,
            },
          };
        }

        const alreadyListed = current.data.some((item) => item.id === hero.id);
        const total = current.pagination.total + (alreadyListed ? 0 : 1);

        return {
          data: [hero, ...current.data.filter((item) => item.id !== hero.id)].slice(
            0,
            current.pagination.per_page,
          ),
          pagination: {
            ...current.pagination,
            total,
            total_pages: Math.ceil(total / current.pagination.per_page),
          },
        };
      });
      setForm(null);
      setSearch('');
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: heroKeys.all });
      setToast({ message: 'Herói criado com sucesso.', severity: 'success' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateHero,
    onSuccess: async (hero) => {
      queryClient.setQueryData(heroKeys.detail(hero.id), hero);
      replaceHeroInCachedLists(hero);
      setForm(null);
      await queryClient.invalidateQueries({ queryKey: heroKeys.all });
      setToast({ message: 'Herói atualizado com sucesso.', severity: 'success' });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (value: ConfirmationState & object) => {
      if (value.action === 'deactivate') return deactivateHero(value.hero.id);
      return setHeroStatus({ id: value.hero.id, isActive: true });
    },
    onSuccess: async (hero, command) => {
      queryClient.setQueryData(heroKeys.detail(hero.id), hero);
      replaceHeroInCachedLists(hero);
      setConfirmation(null);
      await queryClient.invalidateQueries({ queryKey: heroKeys.all });
      setToast({
        message:
          command.action === 'activate'
            ? 'Herói ativado com sucesso.'
            : 'Herói excluído e mantido como inativo.',
        severity: 'success',
      });
    },
  });

  const pagination = heroesQuery.data?.pagination;

  useEffect(() => {
    if (pagination && pagination.total_pages > 0 && page > pagination.total_pages) {
      setPage(pagination.total_pages);
    }
  }, [page, pagination]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function openCreateForm() {
    createMutation.reset();
    updateMutation.reset();
    setForm({ mode: 'create' });
  }

  function openEditForm(hero: Hero) {
    createMutation.reset();
    updateMutation.reset();
    setForm({ mode: 'edit', hero });
  }

  function closeForm() {
    if (createMutation.isPending || updateMutation.isPending) return;
    setForm(null);
  }

  function submitForm(values: HeroInput) {
    if (form?.mode === 'edit') {
      updateMutation.mutate({ id: form.hero.id, input: values });
      return;
    }

    createMutation.mutate(values);
  }

  function openConfirmation(action: 'deactivate' | 'activate', hero: Hero) {
    statusMutation.reset();
    setConfirmation({ action, hero });
  }

  const formError =
    form?.mode === 'edit'
      ? updateMutation.error && getErrorMessage(updateMutation.error)
      : createMutation.error && getErrorMessage(createMutation.error);
  const formPending = createMutation.isPending || updateMutation.isPending;
  const heroes = heroesQuery.data?.data ?? [];
  const resultStart =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.per_page + 1 : 0;
  const resultEnd = pagination
    ? Math.min(pagination.page * pagination.per_page, pagination.total)
    : 0;

  return (
    <Box component="main" sx={{ minHeight: '100vh', pb: 8 }}>
      <Box
        component="header"
        sx={{
          background:
            'radial-gradient(circle at 78% 20%, rgba(99, 122, 255, .5), transparent 28%), linear-gradient(125deg, #111d48 0%, #253d9b 65%, #3154d9 100%)',
          color: 'white',
          overflow: 'hidden',
          pb: { xs: 8, sm: 9 },
          pt: { xs: 4, sm: 5 },
          position: 'relative',
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: '50%',
            height: 360,
            position: 'absolute',
            right: -100,
            top: -210,
            width: 360,
          }}
        />
        <Container maxWidth="xl" sx={{ position: 'relative' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            gap={3}
          >
            <Box>
              <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <Box
                  sx={{
                    alignItems: 'center',
                    bgcolor: 'secondary.main',
                    borderRadius: 1.5,
                    display: 'flex',
                    height: 34,
                    justifyContent: 'center',
                    width: 34,
                  }}
                >
                  <AutoAwesomeRoundedIcon fontSize="small" />
                </Box>
                <Typography
                  fontSize={13}
                  fontWeight={800}
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                >
                  Hero Factory
                </Typography>
              </Stack>
              <Typography component="h1" variant="h1" maxWidth={660}>
                Heróis extraordinários, organizados em um só lugar.
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,.78)', mt: 1.5, maxWidth: 610 }}>
                Consulte, cadastre e mantenha sua coleção de forma simples e objetiva.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<AddRoundedIcon />}
              onClick={openCreateForm}
              sx={{ flexShrink: 0, color: '#431407' }}
            >
              Criar herói
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ mt: -4.5, position: 'relative' }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2.5,
            boxShadow: '0 16px 45px rgba(23,37,84,.12)',
            mb: 3.5,
            overflow: 'hidden',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            gap={2}
            sx={{ p: { xs: 2, sm: 2.5 } }}
          >
            <TextField
              label="Buscar herói"
              placeholder="Nome ou apelido"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              sx={{ width: { xs: '100%', sm: 440 } }}
              inputProps={{ maxLength: 100 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <Tooltip title="Limpar texto da busca">
                      <IconButton
                        aria-label="Limpar texto da busca"
                        edge="end"
                        onClick={() => changeSearch('')}
                      >
                        <ClearRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ) : undefined,
              }}
            />
            <Box aria-live="polite" sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography fontWeight={800}>
                {pagination ? pagination.total : '—'} {pagination?.total === 1 ? 'herói' : 'heróis'}
              </Typography>
              <Typography color="text.secondary" fontSize={13}>
                {debouncedSearch ? `Resultado para “${debouncedSearch}”` : 'Coleção completa'}
              </Typography>
            </Box>
          </Stack>
          {heroesQuery.isFetching && !heroesQuery.isPending && (
            <LinearProgress aria-label="Atualizando lista" />
          )}
        </Box>

        {heroesQuery.isPending && <HeroGridSkeleton />}

        {heroesQuery.isError && !heroesQuery.data && (
          <ErrorState
            message={getErrorMessage(heroesQuery.error)}
            onRetry={() => void heroesQuery.refetch()}
          />
        )}

        {heroesQuery.isError && heroesQuery.data && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => void heroesQuery.refetch()}>
                Tentar novamente
              </Button>
            }
          >
            A lista pode estar desatualizada. {getErrorMessage(heroesQuery.error)}
          </Alert>
        )}

        {heroesQuery.data && heroes.length === 0 && (
          <EmptyState
            searching={Boolean(debouncedSearch)}
            onCreate={openCreateForm}
            onClearSearch={() => changeSearch('')}
          />
        )}

        {heroes.length > 0 && (
          <>
            <Box
              sx={{
                display: 'grid',
                gap: 2.25,
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                  lg: 'repeat(5, minmax(0, 1fr))',
                },
                opacity: heroesQuery.isPlaceholderData ? 0.65 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
              {heroes.map((hero) => (
                <HeroCard
                  key={hero.id}
                  hero={hero}
                  onView={(selectedHero) => setDetailsId(selectedHero.id)}
                  onEdit={openEditForm}
                  onDeactivate={(selectedHero) => openConfirmation('deactivate', selectedHero)}
                  onActivate={(selectedHero) => openConfirmation('activate', selectedHero)}
                />
              ))}
            </Box>

            {pagination && (
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems="center"
                justifyContent="space-between"
                gap={2}
                mt={4}
              >
                <Typography color="text.secondary" fontSize={14}>
                  Exibindo {resultStart}–{resultEnd} de {pagination.total}
                </Typography>
                {pagination.total_pages > 1 && (
                  <Pagination
                    count={pagination.total_pages}
                    page={page}
                    onChange={(_event, nextPage) => setPage(nextPage)}
                    color="primary"
                    shape="rounded"
                    showFirstButton
                    showLastButton
                    aria-label="Paginação de heróis"
                  />
                )}
              </Stack>
            )}
          </>
        )}
      </Container>

      <HeroFormDialog
        open={Boolean(form)}
        hero={form?.mode === 'edit' ? form.hero : undefined}
        pending={formPending}
        submitError={formError || undefined}
        onClose={closeForm}
        onSubmit={submitForm}
      />

      <HeroDetailsDialog heroId={detailsId} onClose={() => setDetailsId(null)} />

      <ConfirmActionDialog
        hero={confirmation?.hero ?? null}
        action={confirmation?.action ?? 'deactivate'}
        pending={statusMutation.isPending}
        error={statusMutation.error ? getErrorMessage(statusMutation.error) : undefined}
        onClose={() => {
          if (!statusMutation.isPending) setConfirmation(null);
        }}
        onConfirm={() => {
          if (confirmation) statusMutation.mutate(confirmation);
        }}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.severity ?? 'success'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
