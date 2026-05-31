import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    blue: [
      '#e8f0fe',
      '#c5d9f9',
      '#9ebff4',
      '#72a5ef',
      '#4d8fea',
      '#2d7ae6',
      '#1a6ad9',
      '#0f5bbf',
      '#0a4da3',
      '#063f87',
    ],
  },
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  defaultRadius: 'md',
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
