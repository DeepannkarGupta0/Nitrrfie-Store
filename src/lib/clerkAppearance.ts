
/**
 * Clerk appearance configuration that aligns with NITRRFIE Store's modern institutional design.
 */
export const appearance = {
  variables: {
    fontFamily: 'var(--font-roboto), sans-serif',
    colorPrimary: '#ff782e',
    colorText: '#0f172a',
    borderRadius: '0.75rem',
  },

  elements: {
    // Main card
    card: {
      borderRadius: '1rem',
      boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
      border: '1px solid #e2e8f0',
    },

    // Heading typography
    headerTitle: {
      fontFamily: 'var(--font-roboto), sans-serif',
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: '28px',
      letterSpacing: '0',
      color: '#0f172a',
    },
    headerSubtitle: 'text-sm text-slate-500',

    // Form fields
    formFieldLabel: 'text-sm font-semibold text-slate-900',
    formFieldInput: 'text-sm rounded-xl',

    // Buttons
    formButtonPrimary: {
      backgroundColor: '#ff782e',
      borderRadius: '0.75rem',
      fontSize: '0.875rem',
      fontWeight: '600',
      '&:hover': {
        backgroundColor: '#e05b12',
      },
    },

    socialButtonsBlockButton:
      'text-sm font-semibold rounded-xl',
  },
};
