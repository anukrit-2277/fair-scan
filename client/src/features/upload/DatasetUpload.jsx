import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Button, Input, FileDropzone, Card, Divider } from '../../components/common';
import { addDataset } from '../datasets/datasetSlice';
import datasetService from '../../services/dataset.service';
import './UploadPage.css';

const DatasetUpload = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [progress, setProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [linkingSheet, setLinkingSheet] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      const res = await datasetService.upload(file, name || undefined, setProgress);
      dispatch(addDataset(res.data.dataset));
      setSuccess(true);
      toast.success('Dataset uploaded successfully');
      setTimeout(() => navigate('/dashboard/datasets'), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }, [file, name, dispatch, navigate]);

  const handleLinkSheet = useCallback(async () => {
    if (!sheetUrl) return;
    setLinkingSheet(true);
    try {
      const res = await datasetService.linkSheet(sheetUrl, sheetName || undefined);
      dispatch(addDataset(res.data.dataset));
      toast.success('Google Sheet linked');
      setTimeout(() => navigate('/dashboard/datasets'), 1200);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLinkingSheet(false);
    }
  }, [sheetUrl, sheetName, dispatch, navigate]);

  const handleClear = () => {
    setFile(null);
    setProgress(null);
    setSuccess(false);
  };

  return (
    <div className="upload-panel">
      <Card>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
          Upload File
        </h3>
        <FileDropzone
          accept=".csv,.json"
          onFile={setFile}
          file={file}
          onClear={handleClear}
          progress={progress}
          uploading={uploading}
          success={success}
          label="Drop your dataset here, or click to browse"
          hint="Supports CSV and JSON — up to 50 MB"
        />

        {file && !success && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input
              label="Dataset name (optional)"
              placeholder={file.name.replace(/\.[^.]+$/, '')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button
              fullWidth
              size="lg"
              loading={uploading}
              onClick={handleUpload}
            >
              Upload Dataset
            </Button>
          </div>
        )}
      </Card>

      <Divider text="or connect a Google Sheet" />

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Google Sheets URL"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
          />
          <Input
            label="Name (optional)"
            placeholder="My dataset"
            value={sheetName}
            onChange={(e) => setSheetName(e.target.value)}
          />
          <Button
            fullWidth
            variant="secondary"
            size="lg"
            loading={linkingSheet}
            disabled={!sheetUrl}
            onClick={handleLinkSheet}
          >
            Link Google Sheet
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DatasetUpload;
