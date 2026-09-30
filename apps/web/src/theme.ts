import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3154d9',
      dark: '#213ba5',
      light: '#e6ebff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f97316',
      dark: '#c2410c',
      light: '#ffedd5',
    },
    background: {
      default: '#f4f7fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#172554',
      secondary: '#5f6b85',
    },
    divider: '#dfe5ef',
    success: {
      main: '#15803d',
    },
    error: {
      main: '#c62828',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: 'clamp(2rem, 4vw, 3.25rem)',
      fontWeight: 800,
      letterSpacing: '-0.04em',
      lineHeight: 1.08,
    },
    h2: {
      fontWeight: 750,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 750,
      letterSpacing: '-0.02em',
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 42,
          borderRadius: 10,
          paddingInline: 18,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
      },
    },
  },
});
