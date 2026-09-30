import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { getErrorMessage } from '@/api/http';
import { formatBirthDate, formatDateTime } from '../formatters';
import { getHero, heroKeys } from '../api';
import { HeroAvatar } from './HeroAvatar';

export function HeroDetailsDialog({
  heroId,
  onClose,
}: {
  heroId: string | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const query = useQuery({
    queryKey: heroKeys.detail(heroId ?? ''),
    queryFn: ({ signal }) => getHero(heroId ?? '', signal),
    enabled: Boolean(heroId),
  });

  const hero = query.data;

  return (
    <Dialog
      open={Boolean(heroId)}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
      aria-labelledby="hero-details-title"
    >
      <DialogTitle id="hero-details-title" fontWeight={800}>
        Detalhes do herói
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {query.isPending && (
          <Stack
            spacing={2}
            aria-label="Carregando detalhes do herói"
            aria-busy="true"
            role="status"
          >
            <Skeleton variant="rounded" height={290} />
            <Skeleton height={42} width="65%" />
            <Skeleton />
            <Skeleton />
          </Stack>
        )}

        {query.isError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void query.refetch()}>
                Tentar novamente
              </Button>
            }
          >
            {getErrorMessage(query.error)}
          </Alert>
        )}

        {hero && (
          <Stack spacing={2.5}>
            <Box sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
              <HeroAvatar
                src={hero.avatar_url}
                nickname={hero.nickname}
                inactive={!hero.is_active}
                height={330}
              />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography component="h2" variant="h4" fontWeight={850}>
                  {hero.nickname}
                </Typography>
                <Chip
                  label={hero.is_active ? 'Ativo' : 'Inativo'}
                  color={hero.is_active ? 'success' : 'default'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Typography color="text.secondary" mt={0.25}>
                {hero.name}
              </Typography>
            </Box>
            <Divider />
            <Box
              component="dl"
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                m: 0,
                '& dt': {
                  color: 'text.secondary',
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                },
                '& dd': { fontWeight: 650, m: 0, mt: 0.4, overflowWrap: 'anywhere' },
              }}
            >
              <Box>
                <Typography component="dt">Universo</Typography>
                <Typography component="dd">{hero.universe}</Typography>
              </Box>
              <Box>
                <Typography component="dt">Data de nascimento</Typography>
                <Typography component="dd">{formatBirthDate(hero.date_of_birth)}</Typography>
              </Box>
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <Typography component="dt">Poder principal</Typography>
                <Typography component="dd">{hero.main_power}</Typography>
              </Box>
              <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                <Typography component="dt">Identificador</Typography>
                <Typography component="dd" fontFamily="monospace" fontSize={13}>
                  {hero.id}
                </Typography>
              </Box>
              <Box>
                <Typography component="dt">Criado em</Typography>
                <Typography component="dd">{formatDateTime(hero.created_at)}</Typography>
              </Box>
              <Box>
                <Typography component="dt">Atualizado em</Typography>
                <Typography component="dd">{formatDateTime(hero.updated_at)}</Typography>
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
