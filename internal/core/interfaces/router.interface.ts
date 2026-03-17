export type RouteHandler = (request: Request) => Response | Promise<Response>;

export interface Route {
    method: string;
    path: string;
    handler: RouteHandler;
}

export interface IRouter {
    get(path: string, handler: RouteHandler): void;
    post(path: string, handler: RouteHandler): void;
    put(path: string, handler: RouteHandler): void;
    delete(path: string, handler: RouteHandler): void;
    patch(path: string, handler: RouteHandler): void;
    options(path: string, handler: RouteHandler): void;
    head(path: string, handler: RouteHandler): void;
    handle(request: Request): Response | Promise<Response>;
}
