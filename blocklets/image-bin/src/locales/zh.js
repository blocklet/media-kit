import flatten from '../libs/flatten';

export default flatten({
  common: {
    updateFailed: '更新图片失败：{reason}',
    updateSuccess: '更新图片成功',
    cancel: '取消',
    move: '移动',
    moveFolder: '移动文件夹',
    moveFolderConfirmTitle: '确认移动到其它文件夹？',
    moveFolderConfirmSelect: '筛选或创建文件夹',
    moveFolderConfirmAddNew: '创建新文件夹：{name}',
    moveFolderAddNewSuccess: '创建文件夹成功',
    delete: '删除',
    deleteConfirmTitle: '确认删除？',
    deleteConfirmMessage: '您确定要删除 <strong>{name}</strong> 吗？此操作不可恢复。',
    deleteFailed: '删除图片失败：{reason}',
    deleteSuccess: '删除图片成功',
    copied: '已复制',
    copyUrl: '复制链接',
    noMore: '已经到底了',
    empty: '暂无上传文件',
    all: '全部',
    upload: '上传到 {name}',
  },
});
