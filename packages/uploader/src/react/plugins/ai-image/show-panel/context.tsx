import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useGetState } from 'ahooks';

interface AiImageContextType {
  disabledSize: boolean;
  multiple: boolean;
  loading: boolean;
  embed: boolean;
  onLoading: (loading: boolean) => void;
}

interface AiImageProviderProps {
  children: ReactNode;
  multiple?: boolean;
  disabledSize: boolean;
  embed: boolean;
}

interface AiImageContextState {
  multiple: boolean;
  loading: boolean;
  disabledSize: boolean;
  embed: boolean;
}

export interface AiImagePromptProps {
  prompt: string;
  sizeWidth: number;
  number: number;
}

export const AiImageContext = createContext<AiImageContextType>({} as AiImageContextType);

export const useAiImageContext = () => useContext(AiImageContext);

export function AiImageProvider({
  multiple = false,
  disabledSize = false,
  embed = false,
  children,
}: AiImageProviderProps) {
  const [state, setState] = useGetState<AiImageContextState>({
    embed,
    multiple,
    loading: false,
    disabledSize,
  });

  const onLoading = (loading: boolean) => setState((prev) => ({ ...prev, loading }));

  const value = useMemo<AiImageContextType>(() => ({ ...state, onLoading }), [state]);

  return <AiImageContext.Provider value={value}>{children}</AiImageContext.Provider>;
}
