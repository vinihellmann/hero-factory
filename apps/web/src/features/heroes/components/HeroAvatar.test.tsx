import { fireEvent, render, screen } from '@testing-library/react';

import { HeroAvatar } from './HeroAvatar';

describe('HeroAvatar', () => {
  it('troca a imagem quebrada por um fallback acessível', () => {
    render(
      <HeroAvatar
        src="https://images.example.test/missing.png"
        nickname="Solaris Prime"
        inactive
      />,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Retrato de Solaris Prime' }));

    expect(screen.getByRole('img', { name: 'Avatar alternativo de Solaris Prime' })).toBeVisible();
    expect(screen.getByText('SP')).toBeVisible();
  });
});
