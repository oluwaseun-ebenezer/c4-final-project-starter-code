import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import * as middy from 'middy'
import { cors, secretsManager } from 'middy/middlewares'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
import Axios from 'axios'

const jwksURL = process.env.AUTH0_JWKS_URL
let cachedCertificate: string

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set

export const handler = middy(
  async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
    logger.info('Authorizing a user', event.authorizationToken)
    try {
      const jwtToken = await verifyToken(event.authorizationToken)
      logger.info('User was authorized', jwtToken)

      return {
        principalId: jwtToken.sub,
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Allow',
              Resource: '*'
            }
          ]
        }
      }
    } catch (e) {
      logger.error('User not authorized', { error: e.message })

      return {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
              Resource: '*'
            }
          ]
        }
      }
    }
  }
)

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  logger.info(`JWT after decoding: ${jwt}`)

  const keyId = jwt.header.kid
  logger.info(`keyId: ${jwt}`)

  const pemCertificate = await getCertificateByKeyId(keyId)

  return verify(token, pemCertificate, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

async function getCertificateByKeyId(keyId: string): Promise<string> {
  if (cachedCertificate) return cachedCertificate

  const response = await Axios.get(jwksURL)
  const keys = response.data.keys

  if (!keys || !keys.length) throw new Error('No JWKS keys found')

  const signingKeys = keys.filter(
    (key) =>
      key.use === 'sig' &&
      key.kty === 'RSA' &&
      key.alg === 'RS256' &&
      key.n &&
      key.e &&
      key.kid === keyId &&
      key.x5c &&
      key.x5c.length
  )

  if (!signingKeys.length) throw new Error('No JWKS signing keys found')

  const matchedKey = signingKeys[0]
  const publicCertificate = matchedKey.x5c[0] // public key

  cachedCertificate = getPemFromCertificate(publicCertificate)

  logger.info('pemCertificate: ', cachedCertificate)

  return cachedCertificate
}

function getPemFromCertificate(cert: string): string {
  let pemCert = cert.match(/.{1,64}/g).join('\n')
  return `-----BEGIN CERTIFICATE-----\n${pemCert}\n-----END CERTIFICATE-----\n`
}

handler
  .use(
    cors({
      credentials: true
    })
  )
  .use(
    secretsManager({
      cache: true,
      cacheExpiryInMillis: 60000,
      // Throw an error if can't read the secret
      throwOnFailedCall: true,
      secrets: {
        AUTH0_JWKS_URL: jwksURL
      }
    })
  )
