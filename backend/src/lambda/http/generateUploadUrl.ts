import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import * as uuid from 'uuid'
import { cors, httpErrorHandler } from 'middy/middlewares'
import { createsuccess, failure, getUserId } from '../utils'
import {
  generateSignedUrl,
  updateAttachmentUrl
} from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'

const logger = createLogger('createTodo')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Generating uploadUrl', { event })
    try {
      const userId = getUserId(event)
      const todoId = event.pathParameters.todoId
      const attachmentId = uuid.v4()

      const uploadUrl = await generateSignedUrl(attachmentId)
      await updateAttachmentUrl(userId, todoId, attachmentId)
      return createsuccess({ uploadUrl })
    } catch (error) {
      return failure(error, error.code)
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
