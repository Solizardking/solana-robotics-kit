/**
 * Cloudflare R2 Storage Integration
 * Connects to the robotics bucket for documentation assets
 */

// R2 bucket URLs
const R2_BUCKET_URL = 'https://pub-d677725afa16499383930c02ee30c019.r2.dev';
const R2_PRIVATE_URL = 'https://2f5db575118d15ec19000e13282201bc.r2.cloudflarestorage.com/robotics';

// Asset paths
const ASSET_PATHS = {
  gfx: '/gfx',
  pdfs: '/pdfs',
  docs: '/docs',
  images: '/images',
};

export interface R2Asset {
  name: string;
  path: string;
  url: string;
  type: 'pdf' | 'image' | 'document' | 'other';
  size?: number;
  lastModified?: string;
}

/**
 * Get public URL for an asset
 */
export function getAssetUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${R2_BUCKET_URL}/${cleanPath}`;
}

/**
 * Get documentation PDFs
 */
export async function getDocumentationPDFs(): Promise<R2Asset[]> {
  // Documentation PDFs hosted on Cloudflare R2
  return [
    {
      name: 'Solana Robotics Kit: Engineering Autonomous Agents',
      path: '/pdfs/Solana_Robotics_Kit_Engineering_Autonomous_Agents.pdf',
      url: getAssetUrl('pdfs/Solana_Robotics_Kit_Engineering_Autonomous_Agents.pdf'),
      type: 'pdf',
    },
    {
      name: 'Self Sovereign Physical Agents',
      path: '/pdfs/Self_Sovereign_Physical_Agents.pdf',
      url: getAssetUrl('pdfs/Self_Sovereign_Physical_Agents.pdf'),
      type: 'pdf',
    },
    {
      name: 'AI Robotics and Autonomous Value',
      path: '/pdfs/AI_Robotics_and_Autonomous_Value.pdf',
      url: getAssetUrl('pdfs/AI_Robotics_and_Autonomous_Value%20(1).pdf'),
      type: 'pdf',
    },
    {
      name: 'Solana Robotics Kit Guide',
      path: '/pdfs/SOLANA_ROBOTICS_GUIDE.pdf',
      url: getAssetUrl('pdfs/SOLANA_ROBOTICS_GUIDE.pdf'),
      type: 'pdf',
    },
    {
      name: 'Solana On-Chain AI Protocol',
      path: '/pdfs/SolanaOn-ChainAIProtocol.pdf',
      url: getAssetUrl('pdfs/SolanaOn-ChainAIProtocol.pdf'),
      type: 'pdf',
    },
  ];
}

/**
 * Get graphics/images from R2
 */
// Homepage preview image
export const HOMEPAGE_PREVIEW_IMAGE = getAssetUrl('pdfs/unnamed%20(2).png');

export async function getGraphicsAssets(): Promise<R2Asset[]> {
  // In production, this would list files from R2
  return [
    {
      name: 'Solana Robotics Preview',
      path: '/pdfs/unnamed (2).png',
      url: getAssetUrl('pdfs/unnamed%20(2).png'),
      type: 'image',
    },
    {
      name: 'SOLtron Avatar',
      path: '/gfx/soltron-avatar.png',
      url: getAssetUrl('gfx/soltron-avatar.png'),
      type: 'image',
    },
    {
      name: 'Robot Registry Banner',
      path: '/gfx/robot-registry-banner.png',
      url: getAssetUrl('gfx/robot-registry-banner.png'),
      type: 'image',
    },
    {
      name: 'GR00T Logo',
      path: '/gfx/groot-logo.png',
      url: getAssetUrl('gfx/groot-logo.png'),
      type: 'image',
    },
  ];
}

/**
 * Get all documentation assets
 */
export async function getAllDocumentationAssets(): Promise<{
  pdfs: R2Asset[];
  graphics: R2Asset[];
}> {
  const [pdfs, graphics] = await Promise.all([
    getDocumentationPDFs(),
    getGraphicsAssets(),
  ]);
  
  return { pdfs, graphics };
}

/**
 * Generate a signed URL for private assets (requires R2 API credentials)
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
  // This would require R2 API credentials to generate signed URLs
  // For public bucket, just return the public URL
  return getAssetUrl(path);
}

export const R2_CONFIG = {
  bucketUrl: R2_BUCKET_URL,
  privateBucketUrl: R2_PRIVATE_URL,
  paths: ASSET_PATHS,
};
