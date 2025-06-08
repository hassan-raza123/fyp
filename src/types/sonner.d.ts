declare module 'sonner' {
  import { ReactNode } from 'react';

  type ToastType = 'success' | 'error' | 'warning' | 'info';

  interface ToastOptions {
    duration?: number;
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right';
    action?: {
      label: string;
      onClick: () => void;
    };
    description?: ReactNode;
    icon?: ReactNode;
    dismissible?: boolean;
    onDismiss?: () => void;
  }

  export const toast: {
    (message: string, options?: ToastOptions): void;
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
    dismiss: (toastId?: string) => void;
    promise: <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      },
      options?: ToastOptions
    ) => Promise<T>;
  };

  export const Toaster: React.FC<{
    position?:
      | 'top-left'
      | 'top-center'
      | 'top-right'
      | 'bottom-left'
      | 'bottom-center'
      | 'bottom-right';
    expand?: boolean;
    richColors?: boolean;
    closeButton?: boolean;
    theme?: 'light' | 'dark' | 'system';
    toastOptions?: ToastOptions;
  }>;
}
