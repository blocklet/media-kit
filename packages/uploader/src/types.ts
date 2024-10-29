import type { UppyOptions } from '@uppy/core';
import type { DashboardOptions } from '@uppy/dashboard';
import type { TusOptions } from '@uppy/tus';
import type { ImageEditorOptions } from '@uppy/image-editor';
import type DropTarget from '@uppy/drop-target';

export type UploaderProps = {
  id?: string;
  popup?: boolean;
  locale?: string;
  onAfterResponse?: (response: any) => void;
  onUploadFinish?: (request: any) => void;
  onOpen?: Function;
  onClose?: Function;
  onChange?: Function;
  plugins?: string[];
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
  wrapperProps?: any;
  coreProps?: UppyOptions;
  dashboardProps?: DashboardOptions;
  apiPathProps?: {
    uploader?: string;
    companion?: string;
    disableMediaKitPrefix?: boolean;
    disableAutoPrefix?: boolean;
  };
  dropTargetProps?: DropTarget;
  initialFiles?: any[];
  imageEditorProps?: ImageEditorOptions;
};
