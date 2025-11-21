// AWS S3 service for storing cloned repositories

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    
    console.log('✓ S3 client initialized');
  }
  
  return s3Client;
}

/**
 * Zip a directory
 */
async function zipDirectory(sourceDir: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Created zip file: ${outputPath} (${archive.pointer()} bytes)`);
      resolve(outputPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    
    // Add directory contents, excluding node_modules and .git
    archive.glob('**/*', {
      cwd: sourceDir,
      ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**']
    });
    
    archive.finalize();
  });
}

/**
 * Upload a cloned repository to S3
 */
export async function uploadRepoToS3(repoPath: string, repoId: string): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  
  if (!bucket) {
    throw new Error('S3_BUCKET environment variable is not set');
  }
  
  try {
    // Create zip file
    const zipPath = path.join(process.cwd(), 'tmp', `${repoId}.zip`);
    await zipDirectory(repoPath, zipPath);
    
    // Upload to S3
    const s3 = getS3Client();
    const key = `repos/${repoId}.zip`;
    
    const fileStream = fs.createReadStream(zipPath);
    
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: 'application/zip'
    }));
    
    console.log(`✓ Uploaded repository to S3: s3://${bucket}/${key}`);
    
    // Clean up zip file
    fs.unlinkSync(zipPath);
    
    return `s3://${bucket}/${key}`;
  } catch (error) {
    console.error('Failed to upload repository to S3:', error);
    throw error;
  }
}

