// server/src/helpers/s3Helper.js
//
// NOTE: I didn't see an existing presigned-URL utility anywhere in the
// files shared with me (the plan's "generate presigned URL as before"
// implies one exists, likely from the registration document-upload flow).
// If you already have one, point me to it and I'll swap this out — this
// is a fresh implementation using the same `aws-sdk` v2 style already
// used in authController.js.
//
// Requires AWS_S3_BUCKET (and reuses AWS_REGION) in your .env. The bucket
// needs a CORS policy allowing PUT from your frontend origin, e.g.:
//   AllowedMethods: [PUT], AllowedOrigins: ["http://localhost:5173", "https://yourdomain.com"],
//   AllowedHeaders: ["*"]

const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION || 'ap-south-1';
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 = new AWS.S3({ region: REGION });

const DOCUMENT_FOLDER = 'client-documents';

const EXTENSION_BY_CONTENT_TYPE = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

/**
 * Generates a short-lived presigned PUT URL the client's browser can
 * upload directly to S3 with — the file never passes through our server.
 *
 * @returns {{ uploadUrl: string, key: string, fileUrl: string }}
 */
function getUploadTicket({ clientId, documentType, contentType }) {
  if (!BUCKET) {
    throw new Error('AWS_S3_BUCKET is not configured in the environment.');
  }

  const ext = EXTENSION_BY_CONTENT_TYPE[contentType] || 'pdf';
  const key = `${DOCUMENT_FOLDER}/${clientId}/${documentType}-${Date.now()}.${ext}`;

  const uploadUrl = s3.getSignedUrl('putObject', {
    Bucket: BUCKET,
    Key: key,
    Expires: 300, // 5 minutes
    ContentType: contentType,
  });

  // Assumes the object (or the bucket) is readable at this URL once
  // uploaded. If your bucket is private, swap this for a signed GET URL
  // generated on read instead of storing a bare URL.
  const fileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  return { uploadUrl, key, fileUrl };
}

module.exports = { getUploadTicket };