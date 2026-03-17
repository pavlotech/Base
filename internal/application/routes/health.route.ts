import Route from "@core/classes/route.class";

export default new Route({ path: "/api/health", method: "GET" }, async (deps, request) => {
    return new Response(JSON.stringify({ status: "ok" }), {
        headers: { "Content-Type": "application/json" },
    });
});
