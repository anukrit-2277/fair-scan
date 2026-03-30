import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlineTableCells,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { Card, Badge, Button, Spinner } from '../../components/common';
import { fetchDataset, clearCurrent, removeDataset } from './datasetSlice';
import './DatasetDetailPage.css';

const DTYPE_COLORS = { number: 'info', string: 'default', boolean: 'warning' };

const DatasetDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current: dataset, preview, loading } = useSelector((s) => s.datasets);

  useEffect(() => {
    dispatch(fetchDataset(id));
    return () => dispatch(clearCurrent());
  }, [id, dispatch]);

  const handleDelete = async () => {
    try {
      await dispatch(removeDataset(id)).unwrap();
      toast.success('Dataset deleted');
      navigate('/dashboard/datasets');
    } catch (err) {
      toast.error(err);
    }
  };

  if (loading || !dataset) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16) 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const columns = dataset.schemaInfo?.columns || [];

  return (
    <motion.div
      className="ds-detail"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ds-detail__topbar">
        <Button variant="ghost" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/dashboard/datasets')}>
          Back
        </Button>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button variant="primary" size="sm" icon={<HiOutlineSparkles />} onClick={() => navigate(`/dashboard/datasets/${id}/analyze`)}>
            {dataset.status === 'analyzed' || dataset.status === 'confirmed' ? 'View Config' : 'Auto-Detect'}
          </Button>
          <Button variant="danger" size="sm" icon={<HiOutlineTrash />} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="ds-detail__header">
        <h2>{dataset.name}</h2>
        <div className="ds-detail__meta">
          <Badge variant="success">{dataset.status}</Badge>
          <span>{dataset.format.toUpperCase()}</span>
          <span>{dataset.schemaInfo?.rowCount?.toLocaleString() || 0} rows</span>
          <span>{columns.length} columns</span>
        </div>
      </div>

      {columns.length > 0 && (
        <Card>
          <div className="ds-detail__section-header">
            <HiOutlineTableCells />
            <h3>Schema</h3>
            <span className="ds-detail__col-count">{columns.length} columns</span>
          </div>
          <div className="ds-detail__schema">
            {columns.map((col) => (
              <div key={col.name} className="schema-col">
                <span className="schema-col__name">{col.name}</span>
                <div className="schema-col__badges">
                  <Badge variant={DTYPE_COLORS[col.dtype] || 'default'} size="sm">{col.dtype}</Badge>
                  {col.isProtected && <Badge variant="danger" size="sm">Protected</Badge>}
                  {col.isProxy && <Badge variant="warning" size="sm">Proxy</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {preview.length > 0 && (
        <Card padding="none">
          <div className="ds-detail__section-header" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <HiOutlineShieldCheck />
            <h3>Data Preview</h3>
            <span className="ds-detail__col-count">First {preview.length} rows</span>
          </div>
          <div className="ds-detail__table-wrapper">
            <table className="ds-detail__table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.name}>{col.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{String(cell ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  );
};

export default DatasetDetailPage;
