# Basic Auth Token Api

Essa classe é uma extensão da classe `PublicApi` e tem como propósito fornecer a base necessária para integração com APIs autenticadas por Basic Auth + Bearer Token.

Essa classe funciona da mesma forma que a [Bearer Api](readme_bearer_api.md), contendo todas suas funcionalidades.

## Exemplo de uso

```javascript
// A única diferença na implementação é a classe base que é extendida
import { BasicAuthTokenApi } from 'api-link-aio';

export class TestIntegration extends BasicAuthTokenApi {
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