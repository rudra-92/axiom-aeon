import { useEffect, useMemo, useRef, useState } from "react";
import Demo from "@/components/ui/demo";
import {
  PIPELINE_STEPS,
  createPreviewItem,
  runSmartDownlinkPipeline,
  summarizeMission,
} from "./data/mockPipeline";

const MAX_UPLOADS = 5;

function StatCard({ label, value, tone = "neutral" }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function PipelineRail({ currentStep, isProcessing }) {
  return (
    <section className="panel panel--pipeline">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Mission Pipeline</p>
          <h2>TerraMind Tiny on-orbit inference chain</h2>
        </div>
        <div className={`processing-pill ${isProcessing ? "is-live" : ""}`}>
          <span className="processing-dot" />
          {isProcessing
            ? "Processing satellite data on-orbit..."
            : "Awaiting batch execution"}
        </div>
      </div>
      <div className="pipeline-rail">
        {PIPELINE_STEPS.map((step, index) => {
          const state =
            index < currentStep ? "done" : index === currentStep ? "active" : "idle";
          return (
            <div key={step.id} className={`pipeline-step pipeline-step--${state}`}>
              <div className="pipeline-step__index">0{index + 1}</div>
              <div>
                <strong>{step.shortLabel}</strong>
                <p>{step.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function UploadPanel({ items, onFilesAdded, onAnalyze, disabled }) {
  return (
    <section id="intake" className="panel panel--upload">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Batch Intake</p>
          <h2>Satellite frame uplink staging</h2>
        </div>
        <div className="upload-limit">
          <span>{items.length}</span> / {MAX_UPLOADS} images
        </div>
      </div>

      <label className="upload-dropzone">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onFilesAdded}
          disabled={disabled}
        />
        <div>
          <strong>Drop or select up to 5 satellite captures</strong>
          <p>
            TerraMind Tiny will simulate edge feature extraction after filtering
            non-crop and duplicate scenes.
          </p>
        </div>
      </label>

      <button
        type="button"
        className="primary-button"
        onClick={onAnalyze}
        disabled={disabled || items.length === 0}
      >
        Analyze Batch
      </button>
    </section>
  );
}

function PreviewGrid({ items }) {
  return (
    <section id="preview" className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Frame Preview</p>
          <h2>Queued orbital captures</h2>
        </div>
      </div>
      <div className="preview-grid">
        {items.length === 0 ? (
          <div className="empty-state">
            <strong>No images loaded</strong>
            <p>The preview grid populates as soon as a batch is uploaded.</p>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="preview-card">
              <img src={item.previewUrl} alt={item.name} />
              <div className="preview-card__meta">
                <strong>{item.name}</strong>
                <span>{item.sizeLabel}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ResultCard({ item }) {
  const decisionTone =
    item.decision === "SEND"
      ? "send"
      : item.decision === "IGNORE"
        ? "ignore"
        : "pending";
  const tagTone =
    item.tag === "CROP"
      ? "crop"
      : item.tag === "DUPLICATE"
        ? "duplicate"
        : item.tag === "NON-CROP"
          ? "noncrop"
          : "pending";

  return (
    <article className="result-card">
      <div className="result-card__image">
        <img src={item.previewUrl} alt={item.name} />
        <div className={`result-chip result-chip--${tagTone}`}>{item.tag}</div>
      </div>
      <div className="result-card__body">
        <div className="result-card__title">
          <strong>{item.name}</strong>
          <span className={`decision decision--${decisionTone}`}>{item.decision}</span>
        </div>
        <p className="status-line">{item.statusText}</p>
        <div className="metric-grid">
          <div>
            <span>Crop Status</span>
            <strong>{item.cropStatus}</strong>
          </div>
          <div>
            <span>Priority</span>
            <strong>{item.priority}</strong>
          </div>
          <div>
            <span>Affected Area</span>
            <strong>{item.affectedArea}</strong>
          </div>
          <div>
            <span>Accuracy</span>
            <strong>{item.confidence}</strong>
          </div>
        </div>
        <div className="reason-block">
          <span>Reason</span>
          <p>{item.reason}</p>
        </div>
      </div>
    </article>
  );
}

function QueueSection({ title, items, emptyText }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Operational Queue</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="queue-list">
        {items.length === 0 ? (
          <div className="empty-state compact">
            <strong>{emptyText}</strong>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="queue-row">
              <strong>{item.name}</strong>
              <span>{item.reason}</span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function DedupLog({ items }) {
  const duplicates = items.filter((item) => item.tag === "DUPLICATE");

  return (
    <section id="dedup-log" className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Review Trace</p>
          <h2>Deduplication Log</h2>
        </div>
      </div>
      <div className="queue-list">
        {duplicates.length === 0 ? (
          <div className="empty-state compact">
            <strong>No duplicate frames removed</strong>
          </div>
        ) : (
          duplicates.map((item) => (
            <article key={item.id} className="queue-row">
              <strong>{item.name}</strong>
              <span>{item.reason}</span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPreparingBatch, setIsPreparingBatch] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const itemsRef = useRef([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const summary = useMemo(() => summarizeMission(items), [items]);
  const uplinkQueue = items.filter((item) => item.decision === "SEND");
  const rejectedQueue = items.filter((item) => item.decision === "IGNORE");

  async function handleFilesAdded(event) {
    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const availableSlots = Math.max(0, MAX_UPLOADS - itemsRef.current.length);

    if (availableSlots === 0) {
      return;
    }

    const nextFiles = selectedFiles.slice(0, availableSlots);

    setIsPreparingBatch(true);
    setCurrentStep(-1);

    try {
      const nextItems = await Promise.all(
        nextFiles.map((file, index) => createPreviewItem(file, index)),
      );

      setItems((currentItems) => {
        const remainingSlots = Math.max(0, MAX_UPLOADS - currentItems.length);

        if (remainingSlots === 0) {
          nextItems.forEach((item) => {
            URL.revokeObjectURL(item.previewUrl);
          });
          return currentItems;
        }

        return [...currentItems, ...nextItems.slice(0, remainingSlots)];
      });
    } finally {
      setIsPreparingBatch(false);
    }
  }

  async function handleAnalyze() {
    if (isPreparingBatch) {
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);

    await runSmartDownlinkPipeline(items, {
      onStage: (stepIndex) => {
        setCurrentStep(stepIndex);
      },
      onItemUpdate: (itemId, patch) => {
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        );
      },
    });

    setIsProcessing(false);
  }

  return (
    <div className="app-shell">
      <Demo />

      <main className="dashboard-shell">
        <div className="dashboard-grid">
          <div className="dashboard-grid__primary">
            <UploadPanel
              items={items}
              onFilesAdded={handleFilesAdded}
              onAnalyze={handleAnalyze}
              disabled={isProcessing || isPreparingBatch}
            />
            <section id="pipeline">
              <PipelineRail
                currentStep={currentStep}
                isProcessing={isProcessing || isPreparingBatch}
              />
            </section>
            <PreviewGrid items={items} />
            <section id="results" className="panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Per-Frame Inference</p>
                  <h2>Smart downlink decisions</h2>
                </div>
              </div>
              <div className="results-grid">
                {items.length === 0 ? (
                  <div className="empty-state">
                    <strong>Upload frames to inspect results</strong>
                    <p>
                      Each image updates independently as the TerraMind Tiny
                      pipeline advances.
                    </p>
                  </div>
                ) : (
                  items.map((item) => <ResultCard key={item.id} item={item} />)
                )}
              </div>
            </section>
          </div>

          <aside className="dashboard-grid__secondary">
            <section id="summary" className="panel">
              <div className="panel__header">
                <div>
                  <p className="eyebrow">Mission Summary</p>
                  <h2>Transmission dashboard</h2>
                </div>
              </div>
              <div className="stats-grid">
                <StatCard label="Total Images" value={summary.total} />
                <StatCard label="Processed" value={summary.processed} />
                <StatCard label="Pending" value={summary.pending} />
                <StatCard label="SENT" value={summary.sent} tone="send" />
                <StatCard
                  label="IGNORED"
                  value={summary.ignored}
                  tone="ignore"
                />
                <StatCard label="Duplicates" value={summary.duplicates} />
                <StatCard label="Non-Crop" value={summary.nonCrop} />
                <StatCard
                  label="Bandwidth Saved"
                  value={`${summary.bandwidthSaved}%`}
                  tone="accent"
                />
                <StatCard
                  label="Transmission Efficiency"
                  value={`${summary.transmissionEfficiency}%`}
                  tone="accent"
                />
              </div>
            </section>

            <QueueSection
              title="Uplink Queue"
              items={uplinkQueue}
              emptyText="Frames marked SEND appear here"
            />
            <QueueSection
              title="Rejected Queue"
              items={rejectedQueue}
              emptyText="Ignored frames and reasons appear here"
            />
            <DedupLog items={items} />
          </aside>
        </div>
      </main>
    </div>
  );
}
