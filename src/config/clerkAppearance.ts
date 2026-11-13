export function getClerkAppearance(
  theme: 'light' | 'dark',
  primaryVariant: 'accent' | 'ink' = 'accent'
) {
  const isDark = theme === 'dark';

  return {
    variables: {
      colorPrimary:
        primaryVariant === 'accent'
          ? '#CC320C'
          : isDark
          ? '#F4F4F5'
          : '#09090B',
      colorTextOnPrimaryBackground:
        primaryVariant === 'accent'
          ? '#FFFFFF'
          : isDark
          ? '#09090B'
          : '#FAFAF9',
      colorBackground: isDark ? '#121214' : '#FFFFFF',
      colorInputBackground: isDark ? '#18181B' : '#F4F4F5',
      colorInputText: isDark ? '#F4F4F5' : '#09090B',
      colorText: isDark ? '#F4F4F5' : '#09090B',
      colorTextSecondary: isDark ? '#A1A1AA' : '#62626B',
      colorNeutral: isDark ? '#F4F4F5' : '#09090B',
      colorDanger: isDark ? '#F87171' : '#DC2626',
      borderRadius: '8px',
    },
    elements: {
      rootBox: 'w-full',
      card: 'shadow-none border-0 bg-transparent p-0 w-full',
      headerTitle: 'text-base font-brand font-bold !text-[var(--ink)]',
      headerSubtitle: 'text-xs !text-[var(--muted)]',
      socialButtonsBlockButton:
        '!bg-[var(--paper-2)] hover:!bg-[var(--paper-3)] !text-[var(--ink)] !border !border-[var(--line-2)] shadow-none transition-colors',
      socialButtonsBlockButtonText: '!text-[var(--ink)] font-medium',
      dividerLine: '!bg-[var(--line)]',
      dividerText: '!text-[var(--muted)]',
      formFieldLabel: '!text-[var(--ink-2)] font-mono text-xs',
      formFieldInput:
        '!bg-[var(--paper-2)] !border !border-[var(--line-2)] !text-[var(--ink)] placeholder:!text-[var(--muted)] focus:!border-[var(--accent)]',
      formButtonPrimary:
        primaryVariant === 'accent'
          ? '!bg-[var(--accent-solid)] hover:!bg-[var(--accent-solid-hover)] !text-white text-xs font-mono uppercase tracking-wider shadow-none'
          : '!bg-[var(--ink)] hover:!bg-[var(--accent-solid)] !text-[var(--on-ink)] hover:!text-white text-xs font-mono uppercase tracking-wider shadow-none',
      footer: '!text-[var(--muted)]',
      footerActionText: '!text-[var(--muted)]',
      footerActionLink: '!text-[var(--accent)] hover:!text-[var(--accent-hover)]',
      badge: '!text-[var(--muted)]',
      identityPreviewText: '!text-[var(--ink)]',
      identityPreviewEditButton: '!text-[var(--accent)]',
      formResendCodeLink: '!text-[var(--accent)]',
      userButtonPopoverCard: 'bg-[var(--paper-card)] border border-[var(--line-2)] shadow-xl',
      userButtonPopoverActionButton: 'text-[var(--ink)] hover:bg-[var(--paper-2)]',
      userButtonPopoverActionButtonText: 'text-[var(--ink)]',
      userButtonPopoverActionButtonIcon: 'text-[var(--muted)]',
      userPreviewMainIdentifier: 'text-[var(--ink)]',
      userPreviewSecondaryIdentifier: 'text-[var(--muted)]',
      userButtonPopoverFooter: 'border-t border-[var(--line)]',
    },
  };
}
