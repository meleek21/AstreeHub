import React from "react";
import { motion } from "framer-motion";
import { getFileIconClass } from "../../../utils/fileUtils";

function QuiltedGrid({ files, onImageSelect }) {
  return (
    <div className="quilted-grid">
      {files.map((file, index) => (
        <motion.div
          key={file.id || file.Id || index}
          className={`quilted-item quilted-item-${index % 9}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.05 }}
          whileHover={{ scale: 1.05, zIndex: 1 }}
          onClick={() => file.fileType?.startsWith('image/') && onImageSelect(file)}
        >
            <img 
              src={file.fileUrl} 
              alt={file.fileName} 
              loading="lazy"
            />
        </motion.div>
      ))}
    </div>
  );
}

export default QuiltedGrid;