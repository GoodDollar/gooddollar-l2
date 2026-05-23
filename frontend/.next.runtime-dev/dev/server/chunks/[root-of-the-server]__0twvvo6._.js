module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/frontend/src/lib/api-error.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "apiError",
    ()=>apiError,
    "methodNotAllowed",
    ()=>methodNotAllowed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
function apiError(status, code, message, extra) {
    const { headers: extraHeaders, cacheControl, ...rest } = extra ?? {};
    const body = {
        error: message,
        code,
        timestamp: new Date().toISOString(),
        ...rest
    };
    const headers = {
        'Content-Type': 'application/json; charset=utf-8'
    };
    if (cacheControl) {
        headers['Cache-Control'] = cacheControl;
    } else if (status >= 400) {
        headers['Cache-Control'] = 'no-store';
    }
    if (extraHeaders) {
        for (const [k, v] of Object.entries(extraHeaders)){
            headers[k] = v;
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(body, {
        status,
        headers
    });
}
function methodNotAllowed(req, allowed) {
    const url = new URL(req.url);
    const allowedUpper = allowed.map((m)=>m.toUpperCase());
    return apiError(405, 'method_not_allowed', 'Method not allowed', {
        path: url.pathname,
        method: req.method,
        allowed: allowedUpper,
        headers: {
            Allow: allowedUpper.join(', ')
        }
    });
}
}),
"[project]/frontend/src/app/api/[...slug]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "HEAD",
    ()=>HEAD,
    "OPTIONS",
    ()=>OPTIONS,
    "PATCH",
    ()=>PATCH,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2d$error$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/src/lib/api-error.ts [app-route] (ecmascript)");
;
/**
 * Catch-all `/api/*` 404 handler.
 *
 * Next.js App Router falls back to the global `app/not-found.tsx` (HTML)
 * when a request hits an `/api/*` path that no route file matches.
 *
 * This catch-all route claims every otherwise-unmatched `/api/*` path and
 * returns the canonical JSON error envelope from {@link apiError}. The route
 * is intentionally lower-priority than concrete sibling routes (Next.js
 * static routes take precedence over dynamic ones), so existing endpoints
 * such as `/api/prices` and `/api/status` continue to work.
 *
 * All HTTP methods get the same 404 envelope so keepers, status pages and
 * external integrators see a consistent response regardless of verb.
 */ function notFound(req) {
    // `NextRequest` exposes `nextUrl`; raw `Request` (used in tests) does not.
    // Fall back to URL parsing in that case.
    const urlString = req.url;
    let pathname = '/';
    try {
        pathname = new URL(urlString).pathname;
    } catch  {
    // best-effort
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$src$2f$lib$2f$api$2d$error$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["apiError"])(404, 'api_route_not_found', 'API route not found', {
        path: pathname,
        method: req.method
    });
}
function GET(req) {
    return notFound(req);
}
function POST(req) {
    return notFound(req);
}
function PUT(req) {
    return notFound(req);
}
function PATCH(req) {
    return notFound(req);
}
function DELETE(req) {
    return notFound(req);
}
function OPTIONS(req) {
    return notFound(req);
}
function HEAD(req) {
    return notFound(req);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0twvvo6._.js.map