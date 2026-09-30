import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

import { getInitials } from '../formatters';

type HeroAvatarProps = {
  src: string;
  nickname: string;
  height?: number | string;
  inactive?: boolean;
};

export function HeroAvatar({ src, nickname, height = 220, inactive = false }: HeroAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (failed || !src) {
    return (
      <Box
        role="img"
        aria-label={`Avatar alternativo de ${nickname}`}
        sx={{
          alignItems: 'center',
          background:
            'radial-gradient(circle at 30% 20%, rgba(255,255,255,.4), transparent 25%), linear-gradient(145deg, #3154d9, #172554)',
          color: 'white',
          display: 'flex',
          filter: inactive ? 'grayscale(1)' : 'none',
          flexDirection: 'column',
          gap: 1,
          height,
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <AutoAwesomeRoundedIcon aria-hidden="true" sx={{ fontSize: 34, opacity: 0.75 }} />
        <Typography component="span" sx={{ fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>
          {getInitials(nickname) || 'HF'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={`Retrato de ${nickname}`}
      onError={() => setFailed(true)}
      sx={{
        display: 'block',
        filter: inactive ? 'grayscale(1)' : 'none',
        height,
        objectFit: 'cover',
        transition: 'filter 180ms ease, transform 250ms ease',
        width: '100%',
      }}
    />
  );
}
