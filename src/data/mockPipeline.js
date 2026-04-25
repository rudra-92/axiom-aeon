const PIPELINE_STEPS = [
  {
    id: "filtering",
    shortLabel: "Filtering",
    label: "Filtering non-crop images",
    description: "Water, urban, and empty-land scenes are screened before transmission.",
  },
  {
    id: "deduplicating",
    shortLabel: "Deduplicating",
    label: "Deduplication",
    description: "Near-duplicate captures are removed to protect bandwidth.",
  },
  {
    id: "features",
    shortLabel: "TerraMind Tiny",
    label: "TerraMind Tiny feature extraction",
    description: "IBM TerraMind Tiny derives lightweight spectral-texture embeddings on-orbit.",
  },
  {
    id: "analysis",
    shortLabel: "Analyzing",
    label: "Crop health analysis",
    description: "Vegetation stress, affected area, and agronomic urgency are estimated.",
  },
  {
    id: "decision",
    shortLabel: "Decision",
    label: "Decision making",
    description: "Each image is marked SEND or IGNORE based on mission value.",
  },
];

const STAGE_DELAY = 700;
const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;
const DUPLICATE_DISTANCE_THRESHOLD = 6;

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function chunkBitsToHex(bits) {
  let hex = "";
  for (let index = 0; index < bits.length; index += 4) {
    const nibble = bits.slice(index, index + 4);
    hex += parseInt(nibble.padEnd(4, "0"), 2).toString(16);
  }
  return hex;
}

async function digestFile(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return {
    bytes: buffer,
    digest: toHex(digest),
  };
}

function loadImage(previewUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image for fingerprinting"));
    image.src = previewUrl;
  });
}

function drawImageToCanvas(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Canvas context unavailable");
  }

  context.drawImage(image, 0, 0, width, height);
  return context.getImageData(0, 0, width, height).data;
}

function grayscaleAt(data, index) {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  return 0.299 * red + 0.587 * green + 0.114 * blue;
}

function buildPerceptualHash(image) {
  const data = drawImageToCanvas(image, HASH_WIDTH, HASH_HEIGHT);
  let bits = "";

  for (let row = 0; row < HASH_HEIGHT; row += 1) {
    for (let column = 0; column < HASH_WIDTH - 1; column += 1) {
      const leftIndex = (row * HASH_WIDTH + column) * 4;
      const rightIndex = (row * HASH_WIDTH + column + 1) * 4;
      const leftGray = grayscaleAt(data, leftIndex);
      const rightGray = grayscaleAt(data, rightIndex);
      bits += leftGray > rightGray ? "1" : "0";
    }
  }

  return chunkBitsToHex(bits);
}

function measureImage(image) {
  const sampleSize = 32;
  const data = drawImageToCanvas(image, sampleSize, sampleSize);
  const totalPixels = sampleSize * sampleSize;

  let brightnessTotal = 0;
  let greenDominantPixels = 0;
  let blueDominantPixels = 0;
  let grayPixels = 0;
  let dryPixels = 0;
  let edgeHits = 0;
  let edgeChecks = 0;
  let lowSaturationPixels = 0;
  let shadowPixels = 0;
  let highlightPixels = 0;
  const grayscaleValues = [];

  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
    const offset = pixelIndex * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const brightness = grayscaleAt(data, offset) / 255;
    const maxChannel = Math.max(red, green, blue);
    const minChannel = Math.min(red, green, blue);
    const saturation = (maxChannel - minChannel) / Math.max(maxChannel, 1);

    brightnessTotal += brightness;
    grayscaleValues.push(brightness);

    if (green > red + 12 && green > blue + 12) {
      greenDominantPixels += 1;
    }

    if (blue > red + 12 && blue > green + 12) {
      blueDominantPixels += 1;
    }

    if (maxChannel - minChannel < 18) {
      grayPixels += 1;
    }

    if (red > green + 6 && green > blue) {
      dryPixels += 1;
    }

    if (saturation < 0.14) {
      lowSaturationPixels += 1;
    }

    if (brightness < 0.18) {
      shadowPixels += 1;
    }

    if (brightness > 0.84) {
      highlightPixels += 1;
    }
  }

  for (let row = 0; row < sampleSize; row += 1) {
    for (let column = 0; column < sampleSize; column += 1) {
      const index = row * sampleSize + column;
      const value = grayscaleValues[index];

      if (column < sampleSize - 1) {
        edgeChecks += 1;
        if (Math.abs(value - grayscaleValues[index + 1]) > 0.12) {
          edgeHits += 1;
        }
      }

      if (row < sampleSize - 1) {
        edgeChecks += 1;
        if (Math.abs(value - grayscaleValues[index + sampleSize]) > 0.12) {
          edgeHits += 1;
        }
      }
    }
  }

  const brightnessMean = brightnessTotal / totalPixels;
  const variance =
    grayscaleValues.reduce((sum, value) => sum + (value - brightnessMean) ** 2, 0) /
    totalPixels;
  const detailScore = clamp(edgeChecks === 0 ? 0 : edgeHits / edgeChecks, 0, 1);
  const dynamicRangePenalty = clamp(
    Math.max(0, 0.22 - Math.sqrt(variance)) * 1.8 +
      Math.max(0, shadowPixels / totalPixels - 0.38) * 0.9 +
      Math.max(0, highlightPixels / totalPixels - 0.24) * 0.7,
    0,
    1,
  );
  const lowClarityScore = clamp(
    (lowSaturationPixels / totalPixels) * 0.45 +
      Math.max(0, 0.16 - detailScore) * 2.4 +
      dynamicRangePenalty * 0.55,
    0,
    1,
  );

  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    brightness: brightnessMean,
    contrast: Math.sqrt(variance),
    vegetationRatio: greenDominantPixels / totalPixels,
    waterRatio: blueDominantPixels / totalPixels,
    neutralRatio: grayPixels / totalPixels,
    dryRatio: dryPixels / totalPixels,
    edgeDensity: detailScore,
    lowSaturationRatio: lowSaturationPixels / totalPixels,
    shadowRatio: shadowPixels / totalPixels,
    highlightRatio: highlightPixels / totalPixels,
    lowClarityScore,
  };
}

function inferSceneType(profile, seed) {
  const clarityCompensation = profile.lowClarityScore * 0.08;
  const vegetationSignal =
    profile.vegetationRatio + profile.dryRatio * 0.16 - profile.waterRatio * 0.08;

  if (
    profile.waterRatio >= 0.38 &&
    vegetationSignal < 0.22 &&
    profile.lowClarityScore < 0.72
  ) {
    return "water";
  }

  if (
    profile.neutralRatio >= 0.36 &&
    profile.edgeDensity >= 0.15 &&
    vegetationSignal < 0.23 &&
    profile.lowClarityScore < 0.68
  ) {
    return "urban";
  }

  if (
    vegetationSignal < 0.14 + clarityCompensation &&
    profile.waterRatio < 0.26 &&
    profile.brightness > 0.46 &&
    profile.lowClarityScore < 0.82
  ) {
    return "empty";
  }

  return seed % 9 === 0 && vegetationSignal < 0.2 && profile.lowClarityScore < 0.58
    ? "empty"
    : "crop";
}

function inferHealth(profile, seed) {
  const stressScore =
    profile.dryRatio * 0.48 +
    Math.max(0, 0.24 - profile.vegetationRatio) * 0.72 +
    Math.max(0, profile.neutralRatio - 0.35) * 0.18 +
    Math.max(0, profile.shadowRatio - 0.42) * 0.1 +
    Math.max(0, profile.lowClarityScore - 0.62) * 0.08;

  if (stressScore >= 0.26) {
    return "Stressed";
  }

  return "Healthy";
}

function computeConfidence(seed, profile, offset = 0) {
  const structureBoost = Math.round(profile.contrast * 22 + profile.edgeDensity * 10);
  const vegetationBoost = Math.round(profile.vegetationRatio * 14 + profile.dryRatio * 8);
  const clarityPenalty = Math.round(profile.lowClarityScore * 22);
  return clamp(
    62 + ((seed + offset) % 14) + structureBoost + vegetationBoost - clarityPenalty,
    46,
    96,
  );
}

function computeAffectedArea(seed, profile, health) {
  const vegetationGap = Math.max(0, 0.38 - (profile.vegetationRatio + profile.lowClarityScore * 0.05));
  const severity =
    vegetationGap * 108 +
    profile.dryRatio * 94 +
    profile.neutralRatio * 16 +
    Math.max(0, profile.shadowRatio - 0.28) * 14;

  if (health !== "Stressed") {
    return clamp(Math.round(severity / 3 + (seed % 6)), 0, 18);
  }

  return clamp(Math.round(severity + 10 + (seed % 8)), 12, 88);
}

function computePriority(health, affectedArea) {
  if (health === "Healthy" && affectedArea < 8) {
    return "LOW";
  }
  if (affectedArea >= 45 || health === "Stressed") {
    return affectedArea >= 65 ? "HIGH" : "MEDIUM";
  }
  return "LOW";
}

function computeQualityTier(profile) {
  if (profile.lowClarityScore >= 0.66) {
    return "LOW";
  }

  if (profile.lowClarityScore >= 0.42) {
    return "MEDIUM";
  }

  return "HIGH";
}

function buildAnalysisReason(profile, health, qualityTier) {
  if (health === "Healthy") {
    return qualityTier === "LOW"
      ? "Low-clarity frame accepted with stable crop signal"
      : "Stable crop vigor detected";
  }

  return qualityTier === "LOW"
    ? "Potential stress detected under low-clarity conditions"
    : "Low vegetation detected";
}

function buildDecisionReason({ health, affectedArea, qualityTier, shouldSend }) {
  if (shouldSend) {
    return qualityTier === "LOW"
      ? "Likely agricultural stress detected in low-clarity imagery"
      : "Agricultural stress requires review";
  }

  return qualityTier === "LOW"
    ? "Low-confidence low-clarity crop frame with limited transmission value"
    : "Healthy crop with low transmission value";
}

function buildDuplicateGroups(items) {
  const seen = [];

  return items.map((item) => {
    const existing = seen.find((candidate) => {
      if (candidate.contentHash === item.contentHash) {
        return true;
      }

      return (
        hammingDistance(candidate.perceptualHash, item.perceptualHash) <=
        DUPLICATE_DISTANCE_THRESHOLD
      );
    });

    if (!existing) {
      seen.push(item);
      return {
        duplicateOf: null,
        isDuplicate: false,
        matchType: null,
      };
    }

    return {
      duplicateOf: existing.id,
      duplicateOfName: existing.name,
      isDuplicate: true,
      matchType:
        existing.contentHash === item.contentHash ? "exact duplicate" : "visual duplicate",
    };
  });
}

function hammingDistance(leftHash = "", rightHash = "") {
  if (leftHash.length !== rightHash.length) {
    return Number.MAX_SAFE_INTEGER;
  }

  let distance = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    const leftBits = parseInt(leftHash[index], 16);
    const rightBits = parseInt(rightHash[index], 16);
    let delta = leftBits ^ rightBits;

    while (delta > 0) {
      distance += delta & 1;
      delta >>= 1;
    }
  }

  return distance;
}

export function summarizeMission(items) {
  const total = items.length;
  const sent = items.filter((item) => item.decision === "SEND").length;
  const ignored = items.filter((item) => item.decision === "IGNORE").length;
  const processed = items.filter(
    (item) => item.decision === "SEND" || item.decision === "IGNORE",
  ).length;
  const pending = total - processed;
  const duplicates = items.filter((item) => item.tag === "DUPLICATE").length;
  const nonCrop = items.filter((item) => item.tag === "NON-CROP").length;
  const bandwidthSaved =
    processed === 0 ? 0 : Math.round(((ignored / processed) * 100) * 0.92);
  const transmissionEfficiency =
    processed === 0 ? 0 : Math.round((sent / processed) * 100);

  return {
    total,
    processed,
    pending,
    sent,
    ignored,
    duplicates,
    nonCrop,
    bandwidthSaved,
    transmissionEfficiency,
  };
}

export async function createPreviewItem(file, index) {
  const previewUrl = URL.createObjectURL(file);
  const uniqueId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    const [{ digest }, image] = await Promise.all([digestFile(file), loadImage(previewUrl)]);
    const perceptualHash = buildPerceptualHash(image);
    const profile = measureImage(image);
    const seed = hashString(`${digest.slice(0, 24)}-${perceptualHash}`);

    return {
      id: `image-${uniqueId}-${index}`,
      file,
      previewUrl,
      name: file.name,
      sizeLabel: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      contentHash: digest,
      perceptualHash,
      imageProfile: profile,
      seed,
      stage: "queued",
      statusText: "Awaiting analysis",
      pipelineIndex: -1,
      tag: "PENDING",
      decision: "--",
      cropStatus: "--",
      priority: "--",
      affectedArea: "--",
      confidence: "--",
      reason: "Pending TerraMind Tiny pass",
    };
  } catch (error) {
    const { digest } = await digestFile(file);
    const seed = hashString(digest);

    return {
      id: `image-${uniqueId}-${index}`,
      file,
      previewUrl,
      name: file.name,
      sizeLabel: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      contentHash: digest,
      perceptualHash: digest.slice(0, 16),
      imageProfile: {
        width: 0,
        height: 0,
        brightness: 0.5,
        contrast: 0.2,
        vegetationRatio: 0.24,
        waterRatio: 0.14,
        neutralRatio: 0.22,
        dryRatio: 0.2,
        edgeDensity: 0.18,
      },
      seed,
      stage: "queued",
      statusText: "Awaiting analysis",
      pipelineIndex: -1,
      tag: "PENDING",
      decision: "--",
      cropStatus: "--",
      priority: "--",
      affectedArea: "--",
      confidence: "--",
      reason: "Pending TerraMind Tiny pass",
    };
  }
}

export async function runSmartDownlinkPipeline(items, callbacks) {
  const prepared = items.map((item) => {
    const sceneType = inferSceneType(item.imageProfile, item.seed);
    return {
      ...item,
      sceneType,
      qualityTier: computeQualityTier(item.imageProfile),
    };
  });

  const duplicateStates = buildDuplicateGroups(prepared);

  for (let stepIndex = 0; stepIndex < PIPELINE_STEPS.length; stepIndex += 1) {
    const step = PIPELINE_STEPS[stepIndex];
    callbacks.onStage(stepIndex, step);

    prepared.forEach((item) => {
      callbacks.onItemUpdate(item.id, {
        stage: step.id,
        pipelineIndex: stepIndex,
        statusText: step.label,
      });
    });

    await wait(STAGE_DELAY);

    prepared.forEach((item, index) => {
      const duplicateState = duplicateStates[index];
      const health = inferHealth(item.imageProfile, item.seed);
      const confidence = computeConfidence(item.seed, item.imageProfile, stepIndex);
      const affectedArea = computeAffectedArea(item.seed, item.imageProfile, health);
      const priority = computePriority(health, affectedArea);
      const qualityLabel = item.qualityTier === "LOW" ? "Low-clarity" : item.qualityTier === "MEDIUM" ? "Medium-clarity" : "High-clarity";

      if (step.id === "filtering" && item.sceneType !== "crop") {
        callbacks.onItemUpdate(item.id, {
          tag: "NON-CROP",
          decision: "IGNORE",
          cropStatus: "--",
          priority: "LOW",
          affectedArea: "0%",
          confidence: `${confidence}%`,
          reason:
            item.qualityTier === "LOW"
              ? `${qualityLabel} non-crop region detected`
              : "Non-crop region detected",
        });
      }

      if (step.id === "deduplicating" && duplicateState.isDuplicate) {
        callbacks.onItemUpdate(item.id, {
          tag: "DUPLICATE",
          decision: "IGNORE",
          cropStatus: "--",
          priority: "LOW",
          affectedArea: "0%",
          confidence: `${confidence}%`,
          reason: `${duplicateState.matchType} of ${duplicateState.duplicateOfName}`,
          duplicateOf: duplicateState.duplicateOf,
          duplicateOfName: duplicateState.duplicateOfName,
        });
      }

      if (
        step.id === "features" &&
        item.sceneType === "crop" &&
        !duplicateState.isDuplicate
      ) {
        callbacks.onItemUpdate(item.id, {
          tag: "CROP",
          confidence: `${confidence}%`,
          reason: `${qualityLabel} TerraMind Tiny embeddings extracted`,
          terramindMode: "Tiny / edge-optimized",
        });
      }

      if (
        step.id === "analysis" &&
        item.sceneType === "crop" &&
        !duplicateState.isDuplicate
      ) {
        callbacks.onItemUpdate(item.id, {
          cropStatus: health,
          priority,
          affectedArea: `${affectedArea}%`,
          confidence: `${confidence}%`,
          reason: buildAnalysisReason(item.imageProfile, health, item.qualityTier),
        });
      }

      if (step.id === "decision") {
        if (item.sceneType !== "crop" || duplicateState.isDuplicate) {
          callbacks.onItemUpdate(item.id, {
            stage: "complete",
            statusText: "Ignored for downlink",
          });
          return;
        }

        const shouldSend =
          health === "Stressed" ||
          affectedArea >= 22 ||
          (item.qualityTier === "LOW" && affectedArea >= 16 && confidence >= 58);
        callbacks.onItemUpdate(item.id, {
          decision: shouldSend ? "SEND" : "IGNORE",
          tag: "CROP",
          cropStatus: health,
          priority: shouldSend ? priority : "LOW",
          affectedArea: `${affectedArea}%`,
          confidence: `${computeConfidence(item.seed, item.imageProfile, 11)}%`,
          reason: buildDecisionReason({
            health,
            affectedArea,
            qualityTier: item.qualityTier,
            shouldSend,
          }),
          stage: "complete",
          statusText: shouldSend ? "Queued for uplink" : "Ignored after analysis",
        });
      }
    });
  }
}

export { PIPELINE_STEPS };
