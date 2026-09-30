import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { heroInputSchema, type Hero, type HeroInput } from '@hero-factory/contracts';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { formatDateTime, toHeroInput } from '../formatters';
import { HeroAvatar } from './HeroAvatar';

const emptyHero: HeroInput = {
  name: '',
  nickname: '',
  date_of_birth: '',
  universe: '',
  main_power: '',
  avatar_url: '',
};

type HeroFormDialogProps = {
  open: boolean;
  hero?: Hero | undefined;
  pending: boolean;
  submitError?: string | undefined;
  onClose: () => void;
  onSubmit: (values: HeroInput) => void;
};

export function HeroFormDialog({
  open,
  hero,
  pending,
  submitError,
  onClose,
  onSubmit,
}: HeroFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isEditing = Boolean(hero);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<HeroInput>({
    resolver: zodResolver(heroInputSchema),
    defaultValues: emptyHero,
  });

  useEffect(() => {
    if (open) reset(hero ? toHeroInput(hero) : emptyHero);
  }, [hero, open, reset]);

  const nickname = watch('nickname');
  const avatarUrl = watch('avatar_url');

  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      aria-labelledby="hero-form-title"
    >
      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          void handleSubmit(onSubmit)(event);
        }}
      >
        <DialogTitle id="hero-form-title" sx={{ pb: 1 }}>
          <Typography component="span" variant="h5" fontWeight={800}>
            {isEditing ? 'Editar herói' : 'Criar herói'}
          </Typography>
          <Typography display="block" color="text.secondary" fontSize={14} mt={0.5}>
            {isEditing
              ? 'Atualize os dados abaixo. O status é alterado separadamente.'
              : 'Preencha os dados para adicionar um novo herói à coleção.'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 3 }}>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 230px' },
            }}
          >
            <Stack spacing={2.25}>
              {submitError && <Alert severity="error">{submitError}</Alert>}
              <TextField
                label="Nome"
                autoFocus
                autoComplete="off"
                fullWidth
                disabled={pending}
                error={Boolean(errors.name)}
                helperText={errors.name?.message ?? 'Nome civil ou identidade do herói.'}
                inputProps={{ maxLength: 255 }}
                {...register('name')}
              />
              <TextField
                label="Apelido"
                autoComplete="off"
                fullWidth
                disabled={pending}
                error={Boolean(errors.nickname)}
                helperText={errors.nickname?.message ?? 'Nome pelo qual o herói é conhecido.'}
                inputProps={{ maxLength: 255 }}
                {...register('nickname')}
              />
              <Box
                sx={{
                  display: 'grid',
                  gap: 2.25,
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
              >
                <TextField
                  label="Data de nascimento"
                  type="date"
                  fullWidth
                  disabled={pending}
                  error={Boolean(errors.date_of_birth)}
                  helperText={errors.date_of_birth?.message}
                  InputLabelProps={{ shrink: true }}
                  {...register('date_of_birth')}
                />
                <TextField
                  label="Universo"
                  autoComplete="off"
                  fullWidth
                  disabled={pending}
                  error={Boolean(errors.universe)}
                  helperText={errors.universe?.message}
                  inputProps={{ maxLength: 255 }}
                  {...register('universe')}
                />
              </Box>
              <TextField
                label="Poder principal"
                autoComplete="off"
                fullWidth
                disabled={pending}
                error={Boolean(errors.main_power)}
                helperText={errors.main_power?.message}
                inputProps={{ maxLength: 255 }}
                {...register('main_power')}
              />
              <TextField
                label="URL do avatar"
                type="url"
                autoComplete="url"
                fullWidth
                disabled={pending}
                error={Boolean(errors.avatar_url)}
                helperText={errors.avatar_url?.message ?? 'Aceita endereços HTTP ou HTTPS.'}
                inputProps={{ maxLength: 2048 }}
                {...register('avatar_url')}
              />

              {hero && (
                <Box>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" fontWeight={800} mb={1.25}>
                    Informações controladas pelo sistema
                  </Typography>
                  <Stack spacing={0.5} color="text.secondary">
                    <Typography variant="body2">
                      <strong>ID:</strong> {hero.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {hero.is_active ? 'Ativo' : 'Inativo'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Criado em:</strong> {formatDateTime(hero.created_at)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Atualizado em:</strong> {formatDateTime(hero.updated_at)}
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Stack>

            <Box>
              <Typography variant="subtitle2" fontWeight={800} mb={1}>
                Prévia do avatar
              </Typography>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
                <HeroAvatar src={avatarUrl} nickname={nickname || 'Novo herói'} height={250} />
              </Box>
              <Typography color="text.secondary" fontSize={12} mt={1}>
                Se a imagem não carregar, a aplicação exibirá um avatar alternativo.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={pending} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending && <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />}
            {isEditing ? 'Salvar alterações' : 'Criar herói'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
