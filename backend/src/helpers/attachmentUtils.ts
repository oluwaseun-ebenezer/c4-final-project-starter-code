import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('attachmentUtils')

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export class AttachmentUtils {
  constructor(
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly signedUrlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async createAttachmentPresignedUrl(todoId: string): Promise<string> {
    logger.info('Creating attachment presigned URL', { todoId })

    return s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: todoId,
      Expires: this.signedUrlExpiration
    })
  }
}
