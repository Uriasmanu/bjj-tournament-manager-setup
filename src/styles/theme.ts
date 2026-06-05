import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: [
      '#e3f2fd',
      '#bbdefb',
      '#90caf9',
      '#64b5f6',
      '#42a5f5',
      '#2196f3',
      '#1565C0',
      '#0d47a1',
      '#0a3d91',
      '#072f73',
    ],
    gray: [
      '#f8f9fa',
      '#f1f3f5',
      '#e9ecef',
      '#dee2e6',
      '#ced4da',
      '#adb5bd',
      '#6c757d',
      '#495057',
      '#343a40',
      '#212529',
    ],
  },
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
  fontSizes: {
    xs: 'clamp(0.75rem, 0.6vw, 0.875rem)',
    sm: 'clamp(0.875rem, 0.7vw, 1rem)',
    md: 'clamp(1rem, 0.8vw, 1.125rem)',
    lg: 'clamp(1.125rem, 0.9vw, 1.25rem)',
    xl: 'clamp(1.25rem, 1vw, 1.5rem)',
  },
  shadows: {
    xs: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
    sm: '0 1px 3px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
    md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
    lg: '0 10px 15px rgba(0,0,0,0.05), 0 4px 6px rgba(0,0,0,0.02)',
    xl: '0 20px 25px rgba(0,0,0,0.06), 0 10px 10px rgba(0,0,0,0.02)',
  },
  components: {
    Button: {
      defaultProps: { size: 'md' },
    },
    Input: {
      defaultProps: { size: 'md' },
    },
    Card: {
      defaultProps: {
        withBorder: true,
        shadow: 'sm',
        radius: 'md',
      },
    },
    Paper: {
      defaultProps: {
        withBorder: true,
        shadow: 'sm',
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        centered: true,
        size: 'lg',
      },
    },
    Table: {
      defaultProps: {
        striped: true,
        highlightOnHover: true,
      },
    },
    Badge: {
      defaultProps: {
        size: 'sm',
      },
    },
  },
});
