import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Button, Input, Card, Badge } from '../../components/common';
import { addModel } from '../models/modelSlice';
import modelService from '../../services/model.service';

const VertexConnect = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    endpointId: '',
    modelId: '',
    projectId: '',
    location: 'us-central1',
    name: '',
    description: '',
  });
  const [connecting, setConnecting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleConnect = useCallback(async () => {
    if (!form.endpointId || !form.modelId) {
      toast.error('Endpoint ID and Model ID are required');
      return;
    }
    setConnecting(true);
    try {
      const res = await modelService.connectVertex(form);
      dispatch(addModel(res.data.model));
      toast.success('Vertex AI model connected');
      setTimeout(() => navigate('/dashboard/datasets'), 1200);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConnecting(false);
    }
  }, [form, dispatch, navigate]);

  return (
    <div className="upload-panel">
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>
            Connect Vertex AI Model
          </h3>
          <Badge variant="accent">Google Cloud</Badge>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="upload-panel__row">
            <Input
              label="Endpoint ID"
              name="endpointId"
              placeholder="1234567890"
              value={form.endpointId}
              onChange={handleChange}
            />
            <Input
              label="Model ID"
              name="modelId"
              placeholder="my-model-v1"
              value={form.modelId}
              onChange={handleChange}
            />
          </div>

          <div className="upload-panel__row">
            <Input
              label="GCP Project ID"
              name="projectId"
              placeholder="my-project-id"
              value={form.projectId}
              onChange={handleChange}
            />
            <Input
              label="Location"
              name="location"
              placeholder="us-central1"
              value={form.location}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Display name (optional)"
            name="name"
            placeholder="My Vertex model"
            value={form.name}
            onChange={handleChange}
          />

          <Input
            label="Description (optional)"
            name="description"
            placeholder="e.g. Production loan model"
            value={form.description}
            onChange={handleChange}
          />

          <Button
            fullWidth
            size="lg"
            loading={connecting}
            disabled={!form.endpointId || !form.modelId}
            onClick={handleConnect}
          >
            Connect Model
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default VertexConnect;
