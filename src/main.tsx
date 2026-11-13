import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';
import { CLERK_PUBLISHABLE_KEY, IS_CLERK_CONFIGURED } from './config/clerk';
import { SafeClerkProvider } from './context/SafeClerkContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';

const rootElement = document.getElementById('root')!;

if (IS_CLERK_CONFIGURED) {
  createRoot(rootElement).render(
    <AppErrorBoundary>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
        <SafeClerkProvider>
          <App />
        </SafeClerkProvider>
      </ClerkProvider>
    </AppErrorBoundary>
  );
} else {
  createRoot(rootElement).render(
    <AppErrorBoundary>
      <SafeClerkProvider>
        <App />
      </SafeClerkProvider>
    </AppErrorBoundary>
  );
}
