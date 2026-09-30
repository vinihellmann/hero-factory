import { Alert, Box, Button, Typography } from '@mui/material';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

type EmptyStateProps = {
  searching: boolean;
  onCreate: () => void;
  onClearSearch: () => void;
};

export function EmptyState({ searching, onCreate, onClearSearch }: EmptyStateProps) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        py: { xs: 7, md: 10 },
        px: 3,
        textAlign: 'center',
      }}
    >
      {searching ? (
        <SearchOffRoundedIcon color="primary" sx={{ fontSize: 52 }} />
      ) : (
        <AutoAwesomeRoundedIcon color="primary" sx={{ fontSize: 52 }} />
      )}
      <Typography component="h2" variant="h5" fontWeight={800} mt={2}>
        {searching ? 'Nenhum herói encontrado' : 'Sua fábrica está vazia'}
      </Typography>
      <Typography color="text.secondary" mt={0.75} mb={2.5} maxWidth={460}>
        {searching
          ? 'Tente outro nome ou apelido para encontrar o herói que procura.'
          : 'Cadastre o primeiro herói para começar a organizar sua coleção.'}
      </Typography>
      <Button variant="contained" onClick={searching ? onClearSearch : onCreate}>
        {searching ? 'Limpar busca' : 'Criar primeiro herói'}
      </Button>
    </Box>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert
      severity="error"
      icon={<ErrorOutlineRoundedIcon fontSize="inherit" />}
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Tentar novamente
        </Button>
      }
      sx={{ alignItems: 'center', py: 1.5 }}
    >
      <Typography fontWeight={700}>Não foi possível carregar os heróis</Typography>
      <Typography component="span" fontSize={14}>
        {message}
      </Typography>
    </Alert>
  );
}
