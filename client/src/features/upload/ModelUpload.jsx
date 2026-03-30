import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Button, Input, FileDropzone, Card } from '../../components/common';
import { addModel } from '../models/modelSlice';
import modelService from '../../services/model.service';

const ModelUpload = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await modelService.upload(file, name || undefined, description || undefined, setProgress);
      dispatch(addModel(res.data.model));
      setSuccess(true);
      toast.success('Model uploaded successfully');
      setTimeout(() => navigate('/dashboard/datasets'), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }, [file, name, description, dispatch, navigate]);

  const handleClear = () => {
    setFile(null);
    setProgress(null);
    setSuccess(false);
  };

  return (
    <div className="upload-panel">
      <Card>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
          Upload ML Model
        </h3>
        <FileDropzone
          accept=".onnx,.h5,.pb,.pkl,.joblib,.pt,.pth,.zip"
          onFile={setFile}
          file={file}
          onClear={handleClear}
          progress={progress}
          uploading={uploading}
          success={success}
          label="Drop your model file here, or click to browse"
          hint="ONNX, TensorFlow (.h5/.pb), scikit-learn (.pkl/.joblib), PyTorch (.pt/.pth) — up to 50 MB"
        />

        {file && !success && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Model name (optional)"
              placeholder={file.name.replace(/\.[^.]+$/, '')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Description (optional)"
              placeholder="e.g. Loan approval classifier v2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              fullWidth
              size="lg"
              loading={uploading}
              onClick={handleUpload}
            >
              Upload Model
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ModelUpload;
