import { Box, Card, Skeleton } from '@mui/material';

export function HeroGridSkeleton() {
  return (
    <Box
      aria-label="Carregando heróis"
      aria-busy="true"
      role="status"
      sx={{
        display: 'grid',
        gap: 2.25,
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
          lg: 'repeat(5, minmax(0, 1fr))',
        },
      }}
    >
      {Array.from({ length: 10 }, (_, index) => (
        <Card key={index} variant="outlined" sx={{ overflow: 'hidden' }}>
          <Skeleton variant="rectangular" height={220} animation="wave" />
          <Box sx={{ p: 2.25 }}>
            <Skeleton width="45%" />
            <Skeleton height={34} width="76%" />
            <Skeleton width="62%" />
            <Skeleton sx={{ mt: 1.5 }} />
            <Skeleton width="80%" />
          </Box>
        </Card>
      ))}
    </Box>
  );
}
