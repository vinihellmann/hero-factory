import { useState, type MouseEvent } from 'react';
import type { Hero } from '@hero-factory/contracts';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PowerSettingsNewRoundedIcon from '@mui/icons-material/PowerSettingsNewRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import { HeroAvatar } from './HeroAvatar';

type HeroCardProps = {
  hero: Hero;
  onView: (hero: Hero) => void;
  onEdit: (hero: Hero) => void;
  onDeactivate: (hero: Hero) => void;
  onActivate: (hero: Hero) => void;
};

export function HeroCard({ hero, onView, onEdit, onDeactivate, onActivate }: HeroCardProps) {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(anchorElement);

  function openMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    setAnchorElement(event.currentTarget);
  }

  function closeMenu() {
    setAnchorElement(null);
  }

  function runAction(action: () => void) {
    setAnchorElement(null);
    action();
  }

  return (
    <Card
      component="article"
      variant="outlined"
      sx={{
        bgcolor: hero.is_active ? 'background.paper' : '#f1f3f7',
        borderColor: hero.is_active ? 'divider' : 'rgba(95, 107, 133, 0.3)',
        boxShadow: hero.is_active ? '0 12px 36px rgba(23, 37, 84, 0.08)' : 'none',
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        transition: 'box-shadow 180ms ease, transform 180ms ease',
        '&:hover': {
          boxShadow: '0 18px 42px rgba(23, 37, 84, 0.14)',
          transform: 'translateY(-3px)',
        },
        '&:focus-within': {
          borderColor: 'primary.main',
        },
      }}
    >
      <CardActionArea
        aria-label={`Ver detalhes de ${hero.nickname}${hero.is_active ? '' : ', inativo'}`}
        onClick={() => onView(hero)}
        sx={{ height: '100%', alignItems: 'stretch' }}
      >
        <HeroAvatar src={hero.avatar_url} nickname={hero.nickname} inactive={!hero.is_active} />
        <CardContent sx={{ minHeight: 168, p: 2.25 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} mb={1}>
            <Typography
              component="span"
              color="primary.main"
              sx={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.1em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {hero.universe}
            </Typography>
            {!hero.is_active && (
              <Chip
                label="Inativo"
                size="small"
                sx={{ fontWeight: 700, height: 24, flexShrink: 0 }}
              />
            )}
          </Stack>
          <Typography
            component="h2"
            variant="h6"
            title={hero.nickname}
            sx={{ fontWeight: 800, lineHeight: 1.2, mb: 0.35 }}
            noWrap
          >
            {hero.nickname}
          </Typography>
          <Typography color="text.secondary" fontSize={14} noWrap title={hero.name}>
            {hero.name}
          </Typography>
          <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 1.6, pt: 1.35 }}>
            <Typography
              color="text.secondary"
              fontSize={11}
              fontWeight={700}
              textTransform="uppercase"
            >
              Poder principal
            </Typography>
            <Typography fontSize={14} fontWeight={600} noWrap title={hero.main_power}>
              {hero.main_power}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>

      <Tooltip title={`Ações de ${hero.nickname}`}>
        <IconButton
          aria-label={`Ações de ${hero.nickname}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={openMenu}
          size="small"
          sx={{
            position: 'absolute',
            right: 10,
            top: 10,
            color: '#172554',
            bgcolor: 'rgba(255,255,255,.92)',
            boxShadow: '0 3px 12px rgba(23,37,84,.18)',
            '&:hover': { bgcolor: 'white' },
          }}
        >
          <MoreVertRoundedIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorElement}
        open={menuOpen}
        onClose={closeMenu}
        onClick={(event) => event.stopPropagation()}
        slotProps={{ paper: { sx: { minWidth: 170 } } }}
      >
        <MenuItem onClick={() => runAction(() => onView(hero))}>
          <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Ver detalhes
        </MenuItem>
        {hero.is_active ? (
          [
            <MenuItem key="edit" onClick={() => runAction(() => onEdit(hero))}>
              <EditOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
              Editar
            </MenuItem>,
            <MenuItem
              key="deactivate"
              onClick={() => runAction(() => onDeactivate(hero))}
              sx={{ color: 'error.main' }}
            >
              <DeleteOutlineRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
              Excluir
            </MenuItem>,
          ]
        ) : (
          <MenuItem
            onClick={() => runAction(() => onActivate(hero))}
            sx={{ color: 'success.main' }}
          >
            <PowerSettingsNewRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
            Ativar
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}
