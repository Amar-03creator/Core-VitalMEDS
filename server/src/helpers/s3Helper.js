// server/src/helpers/s3Helper.js

const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION || 'ap-south-1';
// Support both AWS_S3_BUCKET and S3_BUCKET_NAME so nothing breaks
const BUCKET = process.env.S3_BUCKET_NAME;

// CRITICAL: signatureVersion 'v4' is required for presigned PUT URLs in modern regions
const s3 = new AWS.S3({ 
  region: REGION,
  signatureVersion: 'v4'
});

const DOCUMENT_FOLDER = 'client-documents';

const EXTENSION_BY_CONTENT_TYPE = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

/**
 * Generates a short-lived presigned PUT URL for direct browser-to-S3 uploads.
 * @returns {{ uploadUrl: string, key: string, fileUrl: string }}
 */
function getUploadTicket({ clientId, documentType, contentType }) {
  if (!BUCKET) {
    throw new Error('AWS_S3_BUCKET / S3_BUCKET_NAME is not configured in environment variables.');
  }

  const ext = EXTENSION_BY_CONTENT_TYPE[contentType] || 'pdf';
  const key = `${DOCUMENT_FOLDER}/${clientId}/${documentType}-${Date.now()}.${ext}`;

  const uploadUrl = s3.getSignedUrl('putObject', {
    Bucket: BUCKET,
    Key: key,
    Expires: 60, // 60 seconds is security best practice for edge uploads
    ContentType: contentType,
  });

  const fileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return { uploadUrl, key, fileUrl };
}

/**
 * Takes a raw, private S3 URL and generates a secure 5-minute viewing pass (GET URL).
 * Used by the Admin dashboard to view KYC documents securely.
 */
function getDownloadUrl(fileUrl) {
  if (!fileUrl) return null;
  try {
    const urlObj = new URL(fileUrl);
    // Extract the exact file path from the URL (removes the leading slash)
    const key = decodeURIComponent(urlObj.pathname.substring(1));
    
    return s3.getSignedUrl('getObject', {
      Bucket: BUCKET,
      Key: key,
      Expires: 300 // Valid for exactly 5 minutes
    });
  } catch (e) {
    console.error("Failed to sign URL:", e);
    return fileUrl; // Fallback
  }
}

module.exports = { getUploadTicket, getDownloadUrl };