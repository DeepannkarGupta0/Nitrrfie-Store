/**
 * Clerk appearance configuration that aligns with NITRRFIE Store's modern institutional design.
 */
export const appearance = {
  variables: {
    fontFamily: 'Inter, sans-serif',
    colorPrimary: '#ff782e',
    colorText: '#0f172a',
    borderRadius: '0.75rem',
  },
  elements: {
    card: {
      borderRadius: '1rem',
      boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
      border: '1px solid #e2e8f0',
    },
    formButtonPrimary: {
      backgroundColor: '#ff782e',
      borderRadius: '0.75rem',
      '&:hover': {
        backgroundColor: '#e05b12',
      },
    },
  },
};
