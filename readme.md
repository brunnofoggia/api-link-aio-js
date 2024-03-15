# Classes de Integração de API com Retry Pattern

As classes de integração de API com Retry Pattern são uma abordagem para centralizar a implementação de chamadas de uma API com a biblioteca Axios, adicionando o conceito de classe por integração e o padrão de retry.

## Funcionalidades

Essas classes oferecem as seguintes funcionalidades:

1. Encapsulamento: As classes encapsulam a lógica de integração com uma API, permitindo uma implementação centralizada, organizada e reutilizável.

2. Retry Pattern: O padrão de retry é implementado nas classes, permitindo que as chamadas de API sejam automaticamente refeitas em caso de falha, de acordo com uma política de retry configurável.

3. Autenticação: Foram criadas classes com diferentes mecanismos para gestão automatizada de autenticação, como por exemplo, a classe `BearerApi` que gerencia automaticamente a obtenção e renovação de tokens de autenticação do tipo Bearer.

## Benefícios

Ao utilizar essas classes de integração de API com Retry Pattern, os desenvolvedores podem obter os seguintes benefícios:

1. Simplificação da implementação: As classes abstraem a complexidade da chamada de API, manutenção de autenticação e aplicam o padrão de retry, tornando a implementação mais simples e direta.

2. Reutilização de código: As classes podem ser facilmente reutilizadas em diferentes partes do código, evitando a duplicação de código e promovendo a modularidade.

3. Maior robustez: O padrão de retry ajuda a lidar com falhas temporárias de rede ou indisponibilidade do serviço, aumentando a robustez da aplicação.

## Métodos

Todos os métodos restful são herdados ao estender qualquer uma das classes disponíveis. São eles:

- `get(url, config?)`
- `post(url, data, config?)`
- `put(url, data, config?)`
- `patch(url, data, config?)`
- `delete(url, config?)`
- `options(url, config?)`
- `head(url, config?)`

## Como usar a biblioteca

1. Instalação: Para começar a usar a biblioteca CNAB, você precisa instalá-la em seu projeto. Você pode fazer isso usando o gerenciador de pacotes de sua preferência, como npm ou yarn.

```
npm install brunnofoggia/api-link-aio-js
```

2. Importação: Após a instalação, você pode importar as classes de integração de API com Retry Pattern em seu código.

```javascript
// o nome para importação é 'api-link-aio' sem '-js' ao final do nome
import { PublicApi, BearerApi, BasicAuthTokenApi } from 'api-link-aio';
```

3. Utilização: Agora você pode criar classes de integração e utilizá-las para fazer chamadas de API.

- Para uma API Pública: [Public Api](readme_public_api.md)

- Para uma API autenticada por Bearer Token: [Bearer Api](readme_bearer_api.md)

- Para uma API com "basic auth": [Basic Auth Token Api](readme_basic_auth_token_api.md)