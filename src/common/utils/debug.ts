export function debugInjection(...args) {
    if (this['_debug']) {
        this['_debug'](...args);
    } else if (args.length === 1 && typeof args[0] === 'function') {
        this['_debug'] = args[0];
    }
}
