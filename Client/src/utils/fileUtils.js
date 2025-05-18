export const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  export const getFileIconClass = (fileType) => {
    if (!fileType) return 'file-icon generic';
    if (fileType === 'application/pdf') return 'file-icon pdf';
    if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') 
      return 'file-icon word';
    if (fileType === 'application/vnd.ms-excel' || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') 
      return 'file-icon excel';
    return 'file-icon generic';
  };