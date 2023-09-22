import { UppyOptions } from '@uppy/core';
import { DashboardOptions } from '@uppy/dashboard';
import { TusOptions } from '@uppy/tus';

export type UploaderProps = {
  id?: string;
  popup?: boolean;
  locale?: string;
  onAfterResponse?: (response: any) => void;
  onUploadFinish?: (request: any) => void;
  onOpen?: Function;
  onClose?: Function;
  plugins?: string[];
  uploadedProps?: {
    onSelectedFiles: Function;
  };
  tusProps?: TusOptions;
  wrapperProps?: any;
  coreProps?: UppyOptions;
  dashboardProps?: DashboardOptions;
  apiPathProps?: {
    uploader?: string;
    companion?: string;
    disableMediaKitPrefix?: boolean;
  };
};
