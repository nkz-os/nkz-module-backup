from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
# from .api import routes  # Will uncomment when routes are created
# from .db import session # Will uncomment when DB setup is done

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

# CORS - Restrictive
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # TODO: specific origins in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

@app.get("/metrics")
async def metrics():
    # Placeholder for Prometheus metrics
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from starlette.responses import Response
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Include Routers (commented out until created)
# app.include_router(routes.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
