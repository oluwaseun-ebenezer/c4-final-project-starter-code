import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({ signatureVersion: 'v4' })
const bucket_name = process.env.ATTACHMENT_S3_BUCKET
const URL_expiration = process.env.SIGNED_URL_EXPIRATION

export function getAttachmentUrl(attachmentId: string): string {
  return `https://${bucket_name}.s3.amazonaws.com/${attachmentId}`
}


export async function getUploadUrl(attachmentId: string): Promise<string> {
    const uploadURL = await s3.getSignedUrl('putObject', {
    Bucket: bucket_name,
    Key: attachmentId,
    Expires: Number(URL_expiration)
    })

  return uploadURL
}//getUploadUrl