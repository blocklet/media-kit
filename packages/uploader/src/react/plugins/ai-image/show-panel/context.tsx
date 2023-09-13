import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useGetState } from 'ahooks';

interface AIImageContextType {
  loading: boolean;
  onLoading: (loading: boolean) => void;
  restrictions?: any;
}

interface AIImageProviderProps {
  children: ReactNode;
  restrictions?: any;
}

interface AIImageContextState {
  loading: boolean;
}

export interface AIImagePromptProps {
  prompt: string;
  sizeWidth: number;
  number: number;
}

export const AIImageContext = createContext<AIImageContextType>({} as AIImageContextType);

export const useAIImageContext = () => useContext(AIImageContext);

export function AIImageProvider({ children, restrictions }: AIImageProviderProps) {
  const [state, setState] = useGetState<AIImageContextState>({
    loading: false,
  });

  const onLoading = (loading: boolean) => setState((prev) => ({ ...prev, loading }));

  const value = useMemo<AIImageContextType>(() => ({ ...state, onLoading, restrictions }), [state]);

  return <AIImageContext.Provider value={value}>{children}</AIImageContext.Provider>;
}
