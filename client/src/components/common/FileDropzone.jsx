import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCloudArrowUp,
  HiOutlineDocument,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import './FileDropzone.css';

const formatSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const FileDropzone = ({
  accept,
  maxSize = 50 * 1024 * 1024,
  onFile,
  label = 'Drop your file here, or click to browse',
  hint,
  file,
  onClear,
  progress = null,
  uploading = false,
  success = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateFile = useCallback((f) => {
    setError('');
    if (maxSize && f.size > maxSize) {
      setError(`File too large. Max size: ${formatSize(maxSize)}`);
      return false;
    }
    if (accept) {
      const exts = accept.split(',').map((a) => a.trim().toLowerCase());
      const fileExt = '.' + f.name.split('.').pop().toLowerCase();
      if (!exts.some((a) => a === fileExt || f.type.includes(a.replace('.', '')))) {
        setError(`Invalid format. Accepted: ${accept}`);
        return false;
      }
    }
    return true;
  }, [accept, maxSize]);

  const handleFile = useCallback((f) => {
    if (validateFile(f)) onFile(f);
  }, [validateFile, onFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleClick = () => {
    if (!file && !uploading) inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  return (
    <div className="dropzone-wrapper">
      <div
        className={[
          'dropzone',
          dragOver && 'dropzone--drag',
          file && 'dropzone--has-file',
          uploading && 'dropzone--uploading',
          success && 'dropzone--success',
          error && 'dropzone--error',
        ].filter(Boolean).join(' ')}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="dropzone__input"
        />

        <AnimatePresence mode="wait">
          {!file && !success && (
            <motion.div
              key="empty"
              className="dropzone__empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className={`dropzone__icon ${dragOver ? 'dropzone__icon--active' : ''}`}>
                <HiOutlineCloudArrowUp />
              </div>
              <p className="dropzone__label">{label}</p>
              {hint && <p className="dropzone__hint">{hint}</p>}
            </motion.div>
          )}

          {file && !success && (
            <motion.div
              key="file"
              className="dropzone__file"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="dropzone__file-icon">
                <HiOutlineDocument />
              </div>
              <div className="dropzone__file-info">
                <span className="dropzone__file-name">{file.name}</span>
                <span className="dropzone__file-size">{formatSize(file.size)}</span>
              </div>

              {!uploading && onClear && (
                <button
                  className="dropzone__clear"
                  onClick={(e) => { e.stopPropagation(); onClear(); }}
                  aria-label="Remove file"
                >
                  <HiOutlineXMark />
                </button>
              )}

              {uploading && progress !== null && (
                <div className="dropzone__progress">
                  <div className="dropzone__progress-bar">
                    <motion.div
                      className="dropzone__progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="dropzone__progress-text">{progress}%</span>
                </div>
              )}
            </motion.div>
          )}

          {success && (
            <motion.div
              key="success"
              className="dropzone__success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <HiOutlineCheckCircle className="dropzone__success-icon" />
              <p>Upload complete</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          className="dropzone__error"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default FileDropzone;
