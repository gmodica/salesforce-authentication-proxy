# Salesforce Authentication Proxy

When making API REST calls against Salesforce, the first thing is to obtain an access token, using the OAuth flow of your choice. Once a token is obtained, subsequent calls to the service can be made by including the token to the Authentication header as a Bearer token.

When obtaining a token, there's a limit that is sometimes overlooked, related to the total authentication requests: [Login Rate Limit](https://help.salesforce.com/articleView?id=000312767&type=1&mode=1). There's a total of 3600 authentication requests that a API client can make against the salesforce org. In order to not reach this limit, the recommended approach is to obtain a token and then cache that token and use the cached token for all requests. The cache can have a TTL equal or lower to the session timeout, so whenever the cached token expires a new token should be requested.

Some API clients, or ESB tools do not have, or it is hard to implement, the capability to cache the token and renew the token automatically. This tool will solve this problem by having a proxy layer for authentication with Salesforce. This proxy layer performs the following operations:

* On the first request, the cache will be empty so it retrieves a token using the login-password OAuth flow against a configured salesforce org (using client_id and client_secrect, explained below)
* Caches the obtained token for a configurable TTL
* For any subsequent request, if the cached token is valid (i.e. within the TTL) then it returns the cached token
* If the cached token is not valid, it reauthenticates with Salesforce to obtain a new token, which will then be cached

---
## Installation

This is a nodejs application which can be installed in Heroku or any other cloud that can host nodejs. Once installed, the following environment variables need to be setup:

![Environment Variables](./docs/images/settings.png "Environment Variable")

| Environment Variable | Category | Description | Default |
| -------------------- |:-----------:|:-----------:| -------:|
| **SALESFORCE_AUTHENTICATION_MODE** | Salesforce Authentication               | Whether is *jwt* or *password* | password |
| **SALESFORCE_USERNAME**            | OAuth (Username/Password flows)         | The salesforce username  |  |
| **SALESFORCE_CLIENT_ID**           | OAuth (JWT and Username/Password flows) | The Connected App consumer key. See (1) in the image below |  |
| **SALESFORCE_CLIENT_SECRET**       | OAuth (Username/Password flows)         | The Connected App cusomer secrect. See (2) in the image below  |  |
| **SALESFORCE_ENVIRONMENT**         | OAuth (Username/Password flows)         | Whether is a *sandbox* or *production* | production |
| **SALESFORCE_CALLBACK_URL**        | OAuth (Username/Password flows)         | The Connected App callback URL. See (3) in the image below  |  |
| **SALESFORCE_PASSWORD**            | OAuth (Username/Password flows)         | The salesforce user's password  |  |
| **SALESFORCE_TOKEN**               | OAuth (Username/Password flows)         | The salesforce user's security token  |  |
| **SALESFORCE_AUDIENCE**            | OAuth (JWT Flow)                        | The login URL (e.g. https://login.salesforce.com). This is used to specify the audience when using the JWT authentication flow | |
| **SALESFORCE_JWT_PRIVATE_KEY**     | OAuth (JWT Flow)                        | The private key. This is used for the JWT authentication flow. The private key must match the certificate used to configure the connected app in Salesforce. See details below |  |
| **SECURITY_API_KEY**               | App Security (Header)                   | The API key that needs to be sent as part of the request in the header. See details below  |  |
| **SECURITY_USERNAME**              | App Security (Basic Authentication)     | The username used to verify the Basic Authentication security schema |  |
| **SECURITY_PASSWORD**              | App Security (Basic Authentication)     | The password used to verify the Basic Authentication security schema  |  |
| **SECURITY_REALM**                 | App Security (Basic Authentication)     | The realm used to verify the Basic Authentication security schema  |  |
| **CACHE_TTL_SECONDS**              | Cache                                   | The Time To Live (TTL) of the token in the cache | 60 |

For Salesforce Authentication, it is possible to either use the JWT flow (recommended), or the Username/Password flow.

### JWT Authentication
To use JWT authentication, it is required to configure the following settings:

| Environment Variable | Value | Description |
| -------------------- |:-----------:|:-----------:|
| **SALESFORCE_AUTHENTICATION_MODE** | jwt |  |
| **SALESFORCE_USERNAME**            | gmodica@modicatech.com | The username of the user which is going to request the token |
| **SALESFORCE_CLIENT_ID**           | .... | See (1) in the image below |
| **SALESFORCE_AUDIENCE**            | https://login.salesforce.com | Use https://test.salesforce.com or a custom domain if needed |
| **SALESFORCE_JWT_PRIVATE_KEY**     | -----BEGIN RSA PRIVATE KEY-----<br>.....<br>-----END RSA PRIVATE KEY----- | See this [article](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_auth_key_and_cert.htm). The RSA key is the one obtained in step 3 |

### Username/Password Authentication
To use Username/Password authentication, it is required to configure the following settings:

| Environment Variable | Value | Description |
| -------------------- |:-----------:|:-----------:|
| **SALESFORCE_AUTHENTICATION_MODE** | password |  |
| **SALESFORCE_USERNAME**            | gmodica@modicatech.com | The username of the user which is going to request the token |
| **SALESFORCE_ENVIRONMENT**         | production | Use *sandbox* if connecting to a sandbox |
| **SALESFORCE_CLIENT_ID**           | .... | See (1) in the image below |
| **SALESFORCE_CLIENT_SECRET**       | .... | See (2) in the image below |
| **SALESFORCE_PASSWORD**            | .... | The password for the username |
| **SALESFORCE_TOKEN**               | .... | The security token for the username |
| **SALESFORCE_CALLBACK_URL**        | .... | See (3) in the image below |

![Connected App OAuth Settings](./docs/images/connectedAppSettings.png "Connected App OAuth Settings")


---
## Service Endpoints

The application offers two endpoints:

| Endpoint   | Description |
| ---------- | ----------- |
| Token      | Allows to obtain a Salesforce access token |
| Statistics | Provides statistics about the service |

### Token Endpoint

The token endpoint allows to retrieve a Salesforce access token, either by making an authorization to Salesforce or by getting a valid token from cache

This endpoint can be used as follows:

#### Request
```
GET [serverUrl]/api/salesforce/token[?refresh=true]
```
This is an example request

```
GET /api/salesforce/token HTTP/1.1
x-api-key: SECURITY_API_KEY
Authorization: Basic base64(SECURITY_USERNAME:SECURITY_PASSWORD)
User-Agent: PostmanRuntime/7.28.0
Accept: */*
Host: serverUrl
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

#### Headers

| Header | Value | Remarks |
| ------ | ----- | ------- |
| ```Authorization``` | Basic base64(username:password) | username=**SECURITY_USERNAME**<br />password=**SECURITY_PASSWORD** |
| ```x-api-key```     | api_key | api_key=**SECURITY_API_KEY** |

#### Query Parameters

| Parameter | Value | Description |
| --------- | ----- | ----------- |
| ```refresh``` | true | Forces a refresh of the access token from Salesforce. The cache value is set with the newly obtained token |

#### Response

The response will contain the access token and the salesforce instance url to be used in the REST API calls to Salesforce. Here's an example of the response:

```
HTTP/1.1 200 OK
Server: Cowboy
Connection: keep-alive
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 183
Etag: W/"b7-a2PalO32MhDdnP8JfS1j1OStFkw"
Date: Wed, 12 May 2021 09:07:33 GMT
Via: 1.1 vegur
```
```json
{
    "access_token": "00D5r0000008hVj!ARoAQBRxVPSQ863iCHXCpJdbpK5rsVkz_iDEm3QCkCOMRqgv2Ux3gIAdXE9yH6GN.XGn.j2GpJy4o81.Wn.wz5R9ZjRpOh4c",
    "instance_url": "https://gik--pre.my.salesforce.com"
}
```
The service might return the following HTTP status codes

| HTTP Status Code | Description |
| ---------------- | ----------- |
| ```200``` OK           | The service was able to return the access token |
| ```404``` Bad request  | The client did not send appropriate parameters |
| ```401``` Unauthorized | The client did not authorize successfuly. Either the api token, or the basic authentication credentials are wrong |

### Statistics Endpoint

The statistics endpoint allows to retrieve statistics information about the usage of the service, such as average request time, cache hit ratio, errors, etc.

This endpoint can be used as follows:

#### Request
```
GET [serverUrl]/api/statistics
```
This is an example request

```
GET /api/statistics HTTP/1.1
x-api-key: SECURITY_API_KEY
Authorization: Basic base64(SECURITY_USERNAME:SECURITY_PASSWORD)
User-Agent: PostmanRuntime/7.28.0
Accept: */*
Host: salesforce-authentication-prox.herokuapp.com
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
```

#### Headers

| Header | Value | Remarks |
| ------ | ----- | ------- |
| ```Authorization``` | Basic base64(username:password) | username=**SECURITY_USERNAME**<br />password=**SECURITY_PASSWORD** |
| ```x-api-key```     | api_key | api_key=**SECURITY_API_KEY** |

#### Response

The response will contain statistical information about the token service. Here's an example of the response:

```
HTTP/1.1 200 OK
Server: Cowboy
Connection: keep-alive
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 192
Etag: W/"c0-zoFBUKqweiZBc4NBy4MB8hzUMKE"
Date: Wed, 12 May 2021 09:07:35 GMT
Via: 1.1 vegur
```
```json
{
    "totalRequests": 6,
    "totalCacheHits": 5,
    "totalSalesforceCalls": 1,
    "averageTime": 84.43822133292754,
    "averageCacheTime": 0.9157420009374618,
    "averageSalesforceTime": 502.05061799287796,
    "totalErrors": 0
}
```

The returned statistics are the following

| Statistic | Description |
| --------- | ----------- |
| ```totalRequests``` | Total number of calls to the token endpoint |
| ```totalCacheHits``` | Total number of requests that can be satisfied by retrieving the token from the cache |
| ```totalSalesforceCalls``` | Total number of requests that end up making an authentication call against Salesforce |
| ```averageTime``` | Average time of requests, including requests that are using cache and requests that authenticate against Salesforce |
| ```averageCacheTime``` | Average time of requests that can be satisfied by retrieving the token from the cache |
| ```averageSalesforceTime``` | Average time of request that end up making an authentication call against Salesforce |
| ```totalErrors``` | Total number of errors produced by the service |

The service might return the following HTTP status codes

| HTTP Status Code | Description |
| ---------------- | ----------- |
| ```200``` OK           | The service was able to return the statistics |
| ```404``` Bad request  | The client did not send appropriate parameters |
| ```401``` Unauthorized | The client did not authorize successfuly. Either the api token, or the basic authentication credentials are wrong |
