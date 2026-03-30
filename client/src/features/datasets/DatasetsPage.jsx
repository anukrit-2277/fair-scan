import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlinePlus,
  HiOutlineCircleStack,
  HiOutlineCpuChip,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlineCloud,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { fetchDatasets, removeDataset } from './datasetSlice';
import { fetchModels, removeModel } from '../models/modelSlice';
import './DatasetsPage.css';

const FORMAT_LABELS = {
  csv: 'CSV',
  json: 'JSON',
  google_sheets: 'Sheets',
  sql_export: 'SQL',
};

const FRAMEWORK_LABELS = {
  onnx: 'ONNX',
  tensorflow: 'TensorFlow',
  sklearn: 'scikit-learn',
  pytorch: 'PyTorch',
  vertex_ai: 'Vertex AI',
  unknown: 'Unknown',
};

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatSize = (bytes) => {
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

const DatasetsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: datasets, loading: dsLoading } = useSelector((s) => s.datasets);
  const { items: models, loading: mlLoading } = useSelector((s) => s.models);

  useEffect(() => {
    dispatch(fetchDatasets());
    dispatch(fetchModels());
  }, [dispatch]);

  const handleDeleteDataset = async (id) => {
    try {
      await dispatch(removeDataset(id)).unwrap();
      toast.success('Dataset deleted');
    } catch (err) {
      toast.error(err);
    }
  };

  const handleDeleteModel = async (id) => {
    try {
      await dispatch(removeModel(id)).unwrap();
      toast.success('Model deleted');
    } catch (err) {
      toast.error(err);
    }
  };

  const loading = dsLoading || mlLoading;
  const isEmpty = !datasets.length && !models.length;

  return (
    <div className="datasets-page">
      <div className="datasets-page__header">
        <div>
          <h2 className="datasets-page__title">Datasets & Models</h2>
          <p className="datasets-page__subtitle">
            {isEmpty
              ? 'Upload your first dataset or model to get started.'
              : `${datasets.length} dataset${datasets.length !== 1 ? 's' : ''}, ${models.length} model${models.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button icon={<HiOutlinePlus />} onClick={() => navigate('/dashboard/upload')}>
          Upload
        </Button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16) 0' }}>
          <Spinner size="lg" />
        </div>
      )}

      {!loading && isEmpty && (
        <Card className="datasets-page__empty">
          <HiOutlineCircleStack className="datasets-page__empty-icon" />
          <h3>No uploads yet</h3>
          <p>Upload a dataset or ML model to start a fairness audit.</p>
          <Button onClick={() => navigate('/dashboard/upload')}>Upload Now</Button>
        </Card>
      )}

      {!loading && datasets.length > 0 && (
        <section className="datasets-page__section">
          <h3 className="datasets-page__section-title">
            <HiOutlineCircleStack /> Datasets
          </h3>
          <div className="datasets-page__grid">
            {datasets.map((ds, i) => (
              <motion.div key={ds._id} initial="hidden" animate="visible" variants={fadeIn} custom={i}>
                <Card hover className="ds-card" onClick={() => navigate(`/dashboard/datasets/${ds._id}`)}>
                  <div className="ds-card__top">
                    <div className="ds-card__icon ds-card__icon--dataset">
                      {ds.format === 'google_sheets' ? <HiOutlineCloud /> : <HiOutlineDocumentText />}
                    </div>
                    <Badge variant={ds.status === 'ready' ? 'success' : ds.status === 'error' ? 'danger' : 'default'}>
                      {ds.status}
                    </Badge>
                  </div>
                  <h4 className="ds-card__name">{ds.name}</h4>
                  <div className="ds-card__meta">
                    <span>{FORMAT_LABELS[ds.format] || ds.format}</span>
                    <span>{formatSize(ds.fileSize)}</span>
                    <span>{ds.schemaInfo?.rowCount ? `${ds.schemaInfo.rowCount.toLocaleString()} rows` : '—'}</span>
                  </div>
                  <div className="ds-card__footer">
                    <span className="ds-card__date">{formatDate(ds.createdAt)}</span>
                    <button
                      className="ds-card__delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteDataset(ds._id); }}
                      aria-label="Delete dataset"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {!loading && models.length > 0 && (
        <section className="datasets-page__section">
          <h3 className="datasets-page__section-title">
            <HiOutlineCpuChip /> ML Models
          </h3>
          <div className="datasets-page__grid">
            {models.map((m, i) => (
              <motion.div key={m._id} initial="hidden" animate="visible" variants={fadeIn} custom={i}>
                <Card hover className="ds-card">
                  <div className="ds-card__top">
                    <div className="ds-card__icon ds-card__icon--model">
                      {m.source === 'vertex_ai' ? <HiOutlineCloud /> : <HiOutlineCpuChip />}
                    </div>
                    <Badge variant={m.status === 'ready' ? 'success' : 'default'}>
                      {m.status}
                    </Badge>
                  </div>
                  <h4 className="ds-card__name">{m.name}</h4>
                  <div className="ds-card__meta">
                    <span>{FRAMEWORK_LABELS[m.framework] || m.framework}</span>
                    <span>{m.source === 'vertex_ai' ? 'Vertex AI' : formatSize(m.fileSize)}</span>
                  </div>
                  <div className="ds-card__footer">
                    <span className="ds-card__date">{formatDate(m.createdAt)}</span>
                    <button
                      className="ds-card__delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteModel(m._id); }}
                      aria-label="Delete model"
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default DatasetsPage;
