# Public Api

O propósito dessa classe é fornecer a base necessária para todo tipo de integração com APIs.

## Funcionalidades

Essa classe oferece as seguintes funcionalidades:

1. Encapsulamento: A classe encapsula a lógica de integração com uma API, permitindo uma implementação centralizada, organizada e reutilizável.

2. Retry Pattern: O padrão de retry é implementado na classe, permitindo que as chamadas de API sejam automaticamente refeitas em caso de falha, de acordo com uma política de retry configurável.

## Métodos

A classe `PublicApi` traz consigo todos os métodos restful amparados pelo método `request` que é o responsável por fazer a chamada à API. São eles:

- `get(url, config?)`
- `post(url, data, config?)`
- `put(url, data, config?)`
- `patch(url, data, config?)`
- `delete(url, config?)`
- `options(url, config?)`
- `head(url, config?)`

## Exemplo de Uso

Aqui está um exemplo de como utilizar uma classe de integração de API com Retry Pattern:

```javascript
export class TestIntegration extends PublicApi {
    baseUrl = 'https://api.restful-api.dev';

    async getTest() {
        return this.request({ url: '/objects' });
    }
}

const testIntegration = new TestIntegration();

// exemplo com método nativos:
testIntegration.get('/objects').then(response => {
    console.log(response.data);
});

// exemplo com métodos encapsulados:
testIntegration.getTest().then(response => {
    console.log(response.data);
});
```