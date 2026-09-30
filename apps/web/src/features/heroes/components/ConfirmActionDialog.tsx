import type { Hero } from '@hero-factory/contracts';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

type ConfirmActionDialogProps = {
  hero: Hero | null;
  action: 'deactivate' | 'activate';
  pending: boolean;
  error?: string | undefined;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmActionDialog({
  hero,
  action,
  pending,
  error,
  onClose,
  onConfirm,
}: ConfirmActionDialogProps) {
  const activating = action === 'activate';

  return (
    <Dialog
      open={Boolean(hero)}
      onClose={pending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby="confirm-action-title"
    >
      <DialogTitle id="confirm-action-title" fontWeight={800}>
        {activating ? 'Ativar herói?' : 'Excluir herói?'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {activating
            ? `O herói ${hero?.nickname ?? ''} voltará a permitir edições.`
            : `O herói ${hero?.nickname ?? ''} ficará inativo, mas continuará visível e poderá ser reativado.`}
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={pending} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={pending}
          variant="contained"
          color={activating ? 'primary' : 'error'}
        >
          {pending && <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />}
          {activating ? 'Ativar' : 'Excluir'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
