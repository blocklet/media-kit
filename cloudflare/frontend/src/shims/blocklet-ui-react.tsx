/**
 * Shim for @blocklet/ui-react
 * ComponentInstaller: passthrough wrapper (media-kit is always available on CF)
 */
import { type ReactNode } from 'react';

interface ComponentInstallerProps {
  children: ReactNode;
  onClose?: () => void;
  did?: string;
  disabled?: boolean;
  fallback?: ReactNode;
  [key: string]: any;
}

export default function ComponentInstaller({ children }: ComponentInstallerProps) {
  return <>{children}</>;
}
