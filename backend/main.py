"""
CareerPilot AI — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import RedirectResponse

from core.config import settings
from core.database import engine, Base
from routers import auth, resume, job, interview, dashboard


import openai
from services.ai_service import get_ai_service


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create DB tables on startup, validate OpenRouter setup, cleanup on shutdown."""
    # ── Database ──────────────────────────────────────────────────────────────
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # ── OpenRouter startup validation ─────────────────────────────────────────
    key = settings.OPENROUTER_API_KEY.strip().strip('"').strip("'") if settings.OPENROUTER_API_KEY else ""
    key_loaded = bool(key) and key not in ("your-openrouter-api-key-here", "")
    key_display = f"{key[:8]}...{key[-4:]}" if key_loaded else "(not set)"

    sep = "=" * 60
    print(f"\n{sep}")
    print("  CareerPilot AI - OpenRouter AI Configuration")
    print(sep)
    print(f"  SDK Version    : {openai.__version__} (openai)")
    print(f"  API Key Loaded : {'YES - ' + key_display if key_loaded else 'NO  <-- add OPENROUTER_API_KEY to .env'}")
    print(f"  Base URL       : {settings.OPENROUTER_BASE_URL}")
    print(f"  Model          : {settings.OPENROUTER_MODEL}")
    print(f"  Debug Mode     : {settings.DEBUG}")
    print(sep + "\n")

    if not key_loaded:
        print("  [NOTICE] OPENROUTER_API_KEY is not set in backend/.env.")
        print("  Add your key from https://openrouter.ai/keys to enable real AI features.")

    else:
        try:
            service = get_ai_service()
            print("  [OK] OpenRouter Client initialized successfully.")
            await service.verify_connection()
            print("  [OK] Connection Test: OpenRouter API responded successfully ('OK').")
        except Exception as e:
            print(f"  [WARNING] OpenRouter connection test failed: {e}")

    yield

    await engine.dispose()


app = FastAPI(
    title=settings.APP_NAME,
    description="""🚀 AI-powered placement preparation platform.

Features:
- 🔐 JWT Authentication
- 📄 Resume Analysis with ATS scoring (OpenRouter AI)
- 🏢 Company JD Matching
- 🤖 AI Mock Interviews

## Authentication
All protected endpoints require a Bearer token.
1. Call **POST /api/v1/auth/login** to obtain `access_token`.
2. Click the **Authorize 🔒** button above and enter: `Bearer <your_token>`
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/api/v1")
app.include_router(resume.router, prefix="/api/v1")
app.include_router(job.router, prefix="/api/v1")
app.include_router(interview.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


# ── Health Check ──────────────────────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root_redirect():
    """Redirect root to Swagger UI."""
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health check for deployment monitoring."""
    return {"status": "healthy", "app": settings.APP_NAME, "version": "1.0.0"}



