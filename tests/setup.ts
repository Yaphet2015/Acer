// Node 20 lacks Promise.withResolvers (Chrome 119+ / Node 22+ have it); pi durable uses it.
if (!(Promise as any).withResolvers) (Promise as any).withResolvers = () => { let resolve: any, reject: any; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
