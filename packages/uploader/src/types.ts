import type Uppy from '@uppy/core';
import type { UppyOptions, UppyFile } from '@uppy/core';
import type { DashboardOptions } from '@uppy/dashboard';
import type { TusOptions } from '@uppy/tus';
import type { ImageEditorOptions } from '@uppy/image-editor';
import type DropTarget from '@uppy/drop-target';
import type { HTMLAttributes } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

export interface DropzoneProps {
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick?: () => void;
}

export type UploaderRef = {
  /** 获取底层 Uppy 实例 */
  getUploader: () => Uppy;
  /** 打开上传器 (Dashboard) */
  open: (pluginName?: string) => void;
  /** 关闭上传器 */
  close: () => void;
  /** 触发系统文件选择器 */
  triggerFileInput: (options?: { accept?: string; multiple?: boolean; autoUpload?: boolean }) => void;
  /** 获取拖拽区域 props，绑定到元素即可支持拖拽+点击上传 */
  getDropzoneProps: (options?: { autoUpload?: boolean; noClick?: boolean }) => DropzoneProps;
  /** 批量添加文件 */
  addFiles: (files: File[], options?: { autoUpload?: boolean }) => void;
  /** 开始上传 */
  upload: () => Promise<any>;
  /** 获取当前总进度 0-100 */
  getProgress: () => number;
  /** 获取当前文件列表 */
  getFiles: () => UppyFile[];
  /** 移除指定文件 */
  removeFile: (fileId: string) => void;
  /** 取消所有上传 */
  cancelAll: () => void;
};

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
  disableXssAttack?: boolean;
};
