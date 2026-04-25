# AgriSense Smart Downlink

A production-style React dashboard for a hackathon concept that simulates on-orbit agricultural image triage using **IBM TerraMind Tiny** as the mandatory lightweight feature extraction stage.

## Product Layout

1. Mission header with TerraMind Tiny telemetry
2. Batch upload intake for up to 5 satellite images
3. Live pipeline rail:
   - Filtering non-crop images
   - Deduplication
   - TerraMind Tiny feature extraction
   - Crop health analysis
   - Decision making
4. Preview grid for uploaded frames
5. Dynamic result cards per image
6. Summary dashboard with mission metrics
7. Uplink queue, rejected queue, and deduplication log

## Component Hierarchy

- `AppShell`
- `MissionHeader`
- `TelemetryStrip`
- `UploadPanel`
- `PipelineRail`
- `PreviewGrid`
- `ResultCard`
- `SummaryStatCard`
- `UplinkQueue`
- `RejectedQueue`
- `DeduplicationLog`

## Visual System

- Background: `#07111f`
- Surface: `#0d1b2a`
- Signal blue: `#4fc3ff`
- Transmission green: `#3ddc97`
- Ignore red: `#ff6b6b`
- Mission amber: `#f7c948`
- Headline font: `Chakra Petch`
- Body font: `Space Grotesk`

## TerraMind Tiny Positioning

The UI explicitly treats **IBM TerraMind Tiny** as the model used for stage 3 of the pipeline:

- Non-crop filtering happens first
- Duplicate removal happens second
- TerraMind Tiny lightweight feature extraction happens third
- Crop health scoring follows TerraMind Tiny output
- SEND / IGNORE decisions are made last

## Local Run

```bash
npm install
npm run dev
```
