# OAuth 2.0 Api

Essa classe é uma extensão da classe `TokenAuthApi` e tem como propósito fornecer a base necessária para integração com APIs autenticadas por OAuth 2.0.

## Funcionalidades

Essa classe oferece todas funcionalidades da PublicApi e TokenAuthApi somadas a:

1. Autenticação: A classe gerencia automaticamente a obtenção e renovação de tokens de autenticação do tipo JWT em APIs OAuth 2.0.

## Autenticação

A classe gerencia automaticamente a obtenção e renovação de tokens de autenticação. Antes de executar uma requisição, e também após receber um erro 401, a classe solicita um novo token.

### Implementação

A implementação requer o seguintes atributos base:

- `baseUrl`: A URL base da API.
- `authPath`: O caminho para a requisição de autenticação, pode ser um path que será combinado a baseUrl, ou alguma outra Url, se necessário.
- `authResTokenField`: O nome do campo presente no corpo da resposta que contém o token de autenticação.
    - O nome do campo pode se referir a um campo aninhado, como por exemplo: `data.token`
- `username`: O nome de usuário para autenticação.
- `scope`: (opcional) O escopo da autenticação, se aplicável.

Então se estiver integrando com uma API OAuth 2.0 que utiliza o fluxo de Client Credentials, os atributos adicionais necessários serão:

- `password`: A senha para autenticação.

Mas se estiver integrando com uma API OAuth 2.0 que utiliza o fluxo de Client Assertion, os atributos necessários serão:

- `authGrantType`: O tipo de concessão (grant type) para autenticação OAuth 2.0.
- `scope`: (opcional) O escopo da autenticação, se aplicável.
- `privateKey`: A chave privada do cliente para assinatura do JWT.
- `assertionTTL`: (o opcional) O tempo de vida (em segundos) do JWT de asserção. O padrão é 300 segundos.
- `assertionNotBeforeOffset`: (opcional) O offset (em segundos) para o campo "not before" (nbf) do JWT. O padrão é -1 segundo, para não incluir o nbf no header.
- `assertionAlg`: (opcional) O algoritmo de assinatura do JWT. O padrão é RS256.


### Exemplo de uso do OAuth 2.0 Api

```javascript
import { OAuth2Api } from 'api-link-aio';

class TestOAuth2Api extends OAuth2Api {}
api = new TestOAuth2Api();
await api.initialize({
    baseUrl: 'https://api.test.com',
    username: 'client_id_test',
    password: 'client_secret_test',
    authPath: '/oauth/token',
    authGrantType: 'client_credentials',
    scope: 'read write',
});
```

### Exemplo de uso do OAuth 2.0 Api com Client Assertion

```javascript
import { OAuth2PrivateKeyApi } from 'api-link-aio';

class TestOAuth2PrivateKeyApi extends OAuth2PrivateKeyApi {}
api = new TestOAuth2PrivateKeyApi();
await api.initialize({
    baseUrl: 'https://api.test.com',
    username: 'client_id_test',
    authPath: '/oauth/token',
    authGrantType: 'client_credentials',
    scope: 'read write',
    privateKey: `-----BEGIN PRIVATE KEY-----
    ...
    -----END PRIVATE KEY-----`,
    assertionTTL: 300, // opcional, padrão é 300 segundos
    assertionAlg: 'RS256', // opcional, padrão é RS256
});
```