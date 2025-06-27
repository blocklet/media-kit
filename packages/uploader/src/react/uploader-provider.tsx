import { Box } from '@mui/material';
import { ReactNode, createContext, lazy, useContext, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Uploader from './uploader';
import { UploaderProps } from '../types';

interface UploaderProviderProps extends UploaderProps {
  children: ReactNode;
}

export const UploaderContext = createContext(null);

export function useUploaderContext() {
  const uploaderRef = useContext(UploaderContext);

  if (!uploaderRef) {
    throw new Error('useUploaderContext must be used within an UploaderProvider');
  }

  return uploaderRef;
}

export function UploaderTrigger({ onChange, children, ...restProps }: { onChange?: Function; children?: ReactNode }) {
  const uploaderRef = useUploaderContext();

  const handleOpen = () => {
    // @ts-ignore
    const uploader = uploaderRef?.current?.getUploader();

    uploader?.open();

    if (onChange) {
      // rewrite default emitter
      uploader.onceUploadSuccess((...args: any) => {
        onChange(...args);
      });
    }
  };

  return (
    <Box onClick={handleOpen} {...restProps}>
      {children}
    </Box>
  );
}

export function UploaderProvider({ children, popup, ...restProps }: UploaderProviderProps) {
  const uploaderRef = useRef(null);
  const uploaderRender = useMemo(() => {
    if (popup) {
      return createPortal(<Uploader key="uploader" ref={uploaderRef} popup={true} {...restProps} />, document.body);
    }
    return <Uploader key="uploader" ref={uploaderRef} popup={false} {...restProps} />;
  }, [uploaderRef, popup, restProps]);

  return (
    <UploaderContext.Provider value={uploaderRef as any}>
      {children}
      {uploaderRender}
    </UploaderContext.Provider>
  );
}

export default UploaderProvider;
