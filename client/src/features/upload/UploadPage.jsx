import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineCircleStack,
  HiOutlineCpuChip,
  HiOutlineCloud,
} from 'react-icons/hi2';
import { Tabs } from '../../components/common';
import DatasetUpload from './DatasetUpload';
import ModelUpload from './ModelUpload';
import VertexConnect from './VertexConnect';
import './UploadPage.css';

const UPLOAD_TABS = [
  { id: 'dataset', label: 'Dataset', icon: <HiOutlineCircleStack /> },
  { id: 'model', label: 'ML Model', icon: <HiOutlineCpuChip /> },
  { id: 'vertex', label: 'Vertex AI', icon: <HiOutlineCloud /> },
];

const panelVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const UploadPage = () => {
  const [activeTab, setActiveTab] = useState('dataset');

  return (
    <div className="upload-page">
      <div className="upload-page__header">
        <h2 className="upload-page__title">Upload</h2>
        <p className="upload-page__subtitle">
          Add a dataset, ML model, or connect a deployed Vertex AI endpoint.
        </p>
      </div>

      <Tabs tabs={UPLOAD_TABS} active={activeTab} onChange={setActiveTab} />

      <div className="upload-page__content">
        <AnimatePresence mode="wait">
          {activeTab === 'dataset' && (
            <motion.div
              key="dataset"
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <DatasetUpload />
            </motion.div>
          )}
          {activeTab === 'model' && (
            <motion.div
              key="model"
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <ModelUpload />
            </motion.div>
          )}
          {activeTab === 'vertex' && (
            <motion.div
              key="vertex"
              variants={panelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <VertexConnect />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UploadPage;
