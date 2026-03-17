import { Route, RouteHandler, IRouter } from "@core/interfaces/router.interface";
import { ILogger } from "@core/interfaces/logger.interface";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
};

export default class Router implements IRouter {
    private routes: Route[] = [];

    constructor(private readonly logger?: ILogger) {}

    private readonly addRoute = (method: string, path: string, handler: RouteHandler): void => {
        if (this.routes.some(r => r.method === method && r.path === path)) {
            throw new Error(`Route already exists: ${method} ${path}`);
        }
        this.routes.push({ method, path, handler });
    };

    public get = (path: string, handler: RouteHandler): void => {
        this.addRoute('GET', path, handler);
    };

    public post = (path: string, handler: RouteHandler): void => {
        this.addRoute('POST', path, handler);
    };

    public put = (path: string, handler: RouteHandler): void => {
        this.addRoute('PUT', path, handler);
    };

    public delete = (path: string, handler: RouteHandler): void => {
        this.addRoute('DELETE', path, handler);
    };

    public patch = (path: string, handler: RouteHandler): void => {
        this.addRoute('PATCH', path, handler);
    };

    public options = (path: string, handler: RouteHandler): void => {
        this.addRoute('OPTIONS', path, handler);
    };

    public head = (path: string, handler: RouteHandler): void => {
        this.addRoute('HEAD', path, handler);
    };

    private readonly matchRoute = (routePath: string, requestPath: string): boolean => {
        const routeParts = routePath.split('/');
        const requestParts = requestPath.split('/');

        if (routeParts.length !== requestParts.length) {
            return false;
        }

        return routeParts.every((routePart, i) => {
            const requestPart = requestParts[i];
            return routePart.startsWith(':') || routePart === requestPart;
        });
    };

    private readonly logRequest = async (request: Request, response: Response, startTime: number): Promise<void> => {
        if (!this.logger) return;

        const url = new URL(request.url);
        const duration = Date.now() - startTime;
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') || 'unknown';

        const logData = {
            method: request.method,
            path: url.pathname,
            query: url.search,
            status: response.status,
            duration: `${duration}ms`,
            ip,
            userAgent,
            contentLength: response.headers.get('content-length') || '0'
        };

        if (response.status >= 400) {
            this.logger.error('HTTP Error:', logData);
        } else {
            this.logger.info('HTTP Request:', logData);
        }
    };

    private readonly logRequestBody = async (request: Request): Promise<void> => {
        if (!this.logger) return;

        try {
            const contentType = request.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                const clonedRequest = request.clone();
                const body = await clonedRequest.text();
                if (body && body.length > 0) {
                    try {
                        const parsedBody = JSON.parse(body);
                        const safeBody = this.sanitizeLogData(parsedBody);
                        this.logger.info('Request body:', safeBody);
                    } catch {
                        this.logger.info('Request body (non-JSON):', body.substring(0, 500));
                    }
                }
            }
        } catch (error) {
            this.logger.warn('Failed to log request body:', error);
        }
    };

    private readonly sanitizeLogData = (data: any): any => {
        if (typeof data !== 'object' || data === null) {
            return data;
        }

        const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization'];
        const result = { ...data };

        for (const key in result) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                result[key] = '[REDACTED]';
            } else if (typeof result[key] === 'object') {
                result[key] = this.sanitizeLogData(result[key]);
            }
        }

        return result;
    };

    public readonly handle = async (request: Request): Promise<Response> => {
        const startTime = Date.now();

        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        const url = new URL(request.url);
        const { pathname: path } = url;
        const { method } = request;

        if (this.logger) {
            this.logger.info(`Incoming request: ${method} ${path}`);
            await this.logRequestBody(request);
        }

        const response = await this.executeRoute(request, method, path);

        Object.entries(corsHeaders).forEach(([key, value]) => {
            if (!response.headers.has(key)) {
                response.headers.set(key, value);
            }
        });

        await this.logRequest(request, response, startTime);

        return response;
    };

    private readonly executeRoute = async (request: Request, method: string, path: string): Promise<Response> => {
        const route = this.routes.find(r => r.method === method && this.matchRoute(r.path, path));

        if (!route) {
            if (this.logger) {
                this.logger.warn('Route not found:', { method, path });
            }
            return new Response(
                JSON.stringify({ error: 'Not Found' }),
                {
                    status: 404,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                }
            );
        }

        try {
            return await route.handler(request);
        } catch (error) {
            if (this.logger) {
                this.logger.error('Route handler error:', {
                    method,
                    path,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined
                });
            }
            return new Response(
                JSON.stringify({ error: 'Internal server error' }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                }
            );
        }
    };
}
