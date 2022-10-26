declare module ImageBin {
  export interface Upload {
    filename: string;
    mimetype: string;
    size: number;
    originalname: string;
    remark: string;
    createAt: string;
    updateAt: string;
    createdBy: string;
    updateBy: string;
    folderId?: string;
    objectUrl: string;
  }
}
