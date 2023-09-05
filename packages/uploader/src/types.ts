import { UppyOptions } from '@uppy/core';
import { DashboardOptions } from '@uppy/dashboard';

export type UploaderProps = {
  id?: string;
  popup?: boolean;
  onAfterResponse?: (response: any) => void;
  onUploadFinish?: (request: any) => void;
  onOpen?: Function;
  onClose?: Function;
  plugins?: string[];
  uploadedProps?: {
    onSelectedFiles: Function;
  };
  wrapperProps?: any;
  coreProps?: UppyOptions;
  dashboardProps?: DashboardOptions;
  apiPathProps?: {
    uploader?: string;
    companion?: string;
  };
};
