export interface Descriptor {
  api: string
  token: string
  projectId: string
  subProjectId: string
  streamId: string
  stagedAssetIds: string[]
  output: string
  optimize?: boolean
}

export interface Part {
  assetName: string
  partId: string
  docking?: string
  model3dUrl: string
  transformMatrix: number[]
  localPath: string | null
}

export interface StagedAsset {
  id?: string
  name?: string
  asset?: Record<string, unknown>
  metaData?: unknown[]
}

export interface StitchResult {
  stagedAssetId: string
  outputDir: string
  glbPath: string
  descriptionPath: string
  partCount: number
  skippedNodes: number
}

export interface RunDeps {
  fetchImpl?: typeof fetch
  now?: () => string
  log?: (message: string) => void
}

export function loadDescriptor(path: string): Promise<Descriptor>
export function validateDescriptor(value: unknown): Descriptor

export function stagedAssetUrl(params: {
  api: string
  projectId: string
  subProjectId: string
  streamId: string
  id: string
}): string

export function fetchStagedAsset(params: {
  api: string
  token: string
  projectId: string
  subProjectId: string
  streamId: string
  id: string
  fetchImpl?: typeof fetch
}): Promise<StagedAsset>

export function flattenParts(stagedAsset: StagedAsset): { parts: Part[]; skippedNodes: number }

export function downloadAll(
  parts: Part[],
  outDir: string,
  options?: { concurrency?: number; fetchImpl?: typeof fetch }
): Promise<Part[]>

export function buildGlb(
  parts: Part[],
  outPath: string,
  options?: { optimize?: boolean }
): Promise<{ outPath: string; nodeCount: number }>

export function buildDescription(
  stagedAsset: StagedAsset,
  parts: Part[],
  meta: {
    projectId: string
    subProjectId: string
    streamId: string
    outputGlb: string
    skippedNodes: number
    generatedAt?: string
  }
): Record<string, unknown>

export function stitchStagedAsset(
  descriptor: Descriptor,
  stagedAssetId: string,
  deps?: RunDeps
): Promise<StitchResult>

export function orchestrate(descriptor: Descriptor, deps?: RunDeps): Promise<StitchResult[]>
