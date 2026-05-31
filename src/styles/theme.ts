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
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
    },
    Input: {
      defaultProps: {
        size: 'md',
      },
    },
  },
});
