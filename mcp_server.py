import os
import sys
from fastmcp import FastMCP
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create MCP server
mcp = FastMCP("AddNumbers", stateless_http=True)

@mcp.tool()
def add_numbers(a: float = 10.0, b: float = 5.0) -> dict:
    """Add two numbers"""
    return {"a": a, "b": b, "result": a + b}

# Minimal OAuth endpoint (just enough for Claude.ai)
async def oauth_metadata(request: Request):
    base_url = str(request.base_url).rstrip("/")
    return JSONResponse({
        "issuer": base_url
    })

http_app = mcp.http_app(transport="streamable-http", path='/mcp')

# Create a FastAPI app and mount the MCP server
app = FastAPI(lifespan=http_app.lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Access-Control-Allow-Origin
    allow_methods=["GET", "POST", "OPTIONS"],  # Access-Control-Allow-Methods
    allow_headers=["Content-Type", "Authorization", "x-api-key"],  # Access-Control-Allow-Headers
    expose_headers=["Content-Type", "Authorization", "x-api-key"],  # Access-Control-Expose-Headers
    max_age=86400  # Access-Control-Max-Age (in seconds)
)

# Add the OAuth metadata route before mounting
app.add_api_route("/.well-known/oauth-authorization-server", oauth_metadata, methods=["GET"])

# Mount the MCP server
app.mount("/", http_app)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8001))
    print(f"Greet Service - MCP endpoint: http://localhost:{port}/mcp")
    uvicorn.run("mcp_server:app", host="0.0.0.0", port=port, reload=True)
