import { UppyOptions } from '@uppy/core';
import { DashboardOptions } from '@uppy/dashboard';

export type UploaderProps = {
  id?: string;
  popup?: boolean;
  onAfterResponse?: (response: any) => void;
  onUploadFinish?: (request: any) => void;
  plugins?: string[];
  uploadedProps?: {
    onSelectedFiles: Function;
  };
  coreProps?: UppyOptions;
  dashboardProps?: DashboardOptions;
  apiPathProps: {
    uploader: string;
    companion?: string;
  };
};
