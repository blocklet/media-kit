import type { UppyOptions } from '@uppy/core';
import type { DashboardOptions } from '@uppy/dashboard';
import type { TusOptions } from '@uppy/tus';
import type { ImageEditorOptions } from '@uppy/image-editor';
import type DropTarget from '@uppy/drop-target';
import type { HTMLAttributes } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

export type UploaderProps = {
  id?: string;
  popup?: boolean;
  locale?: string;
  onAfterResponse?: (response: any) => void;
  onUploadFinish?: (request: any) => void;
  onOpen?: Function;
  onClose?: Function;
  onChange?: Function;
  plugins?:
    | string[]
    | {
        id: string;
        options: {
          id: string;
          title: string;
          icon?: string | React.ReactNode;
          autoHide?: boolean;
        };
        onShowPanel?: (ref: React.RefObject<any>) => void;
      }[];
  installerProps?: {
    disabled?: boolean;
    fallback?: any;
  };
  uploadedProps?: {
    params?: any;
    onSelectedFiles?: Function;
  };
  resourcesProps?: {
    params?: any;
    onSelectedFiles?: Function;
  };
  tusProps?: TusOptions;
  wrapperProps?: HTMLAttributes<HTMLDivElement> & {
    sx?: SxProps<Theme>;
    className?: string;
    style?: React.CSSProperties;
  };
  coreProps?: UppyOptions;
  dashboardProps?: DashboardOptions;
  apiPathProps?: {
    uploader?: string;
    companion?: string;
    disableMediaKitPrefix?: boolean;
    disableAutoPrefix?: boolean;
    disableMediaKitStatus?: boolean;
  };
  dropTargetProps?: DropTarget;
  initialFiles?: any[];
  imageEditorProps?: ImageEditorOptions;
};
