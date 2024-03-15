# Bearer Api

Essa classe é uma extensão da classe `PublicApi` e tem como propósito fornecer a base necessária para integração com APIs autenticadas por Bearer Token.

## Funcionalidades

Essa classe oferece todas funcionalidades da PublicApi somadas a:

1. Autenticação: A classe gerencia automaticamente a obtenção e renovação de tokens de autenticação do tipo Bearer.

## Autenticação

A classe gerencia automaticamente a obtenção e renovação de tokens de autenticação. Antes de executar uma requisição, e também após receber um erro 401, a classe solicita um novo token.

### Implementação

A implementação requer o seguintes atributos:

- `baseUrl`: A URL base da API.
- `authPath`: O caminho para a requisição de autenticação, pode ser um path que será combinado a baseUrl, ou alguma outra Url, se necessário.
- `authResTokenField`: O nome do campo presente no corpo da resposta que contém o token de autenticação.
    - O nome do campo pode se referir a um campo aninhado, como por exemplo: `data.token`
- `username`: O nome de usuário para autenticação.
- `password`: A senha para autenticação.

Caso seja necessário atribuir esses valores dinamicamente, é possível fazer isso através do método `initialize`, conforme exemplo:

```javascript
import { BearerApi } from 'api-link-aio';

export class TestIntegration extends BearerApi {
    async initialize(...args) {
        // atribuição dinâmica dos valores pode ser feita 
        // 1. com base em valores de entrada
        // 2. de forma assíncrona se necessário
        // 3. com base em valores de ambiente
        this.baseUrl = 'https://api.restful-api.dev';
        this.authPath = '/auth';
        this.responseTokenField = 'data.token';
        this.username = 'user';
        this.password = 'pass';
    }
}
```