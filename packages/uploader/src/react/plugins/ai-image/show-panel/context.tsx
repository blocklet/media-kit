import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useGetState } from 'ahooks';

interface AIImageContextType {
  loading: boolean;
  onLoading: (loading: boolean) => void;
  restrictions?: any;
  i18n: Function;
}

interface AIImageProviderProps {
  children: ReactNode;
  restrictions?: any;
  i18n: Function;
}

interface AIImageContextState {
  loading: boolean;
}

export interface AIImagePromptProps {
  prompt: string;
  size: string;
  number: number;
  model: 'dall-e-3' | 'dall-e-2';
}

export const AIImageContext = createContext<AIImageContextType>({} as AIImageContextType);

export const useAIImageContext = () => useContext(AIImageContext);

export function AIImageProvider({ children, restrictions, i18n }: AIImageProviderProps) {
  const [state, setState] = useGetState<AIImageContextState>({
    loading: false,
  });

  const onLoading = (loading: boolean) => setState((prev) => ({ ...prev, loading }));

  const value = useMemo<AIImageContextType>(() => ({ ...state, onLoading, restrictions, i18n }), [state]);

  return <AIImageContext.Provider value={value}>{children}</AIImageContext.Provider>;
}
