from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from ..config import get_settings
from ..models.backup_config import Base

settings = get_settings()


def _async_url(url: str) -> str:
    """Convert postgresql:// DSN to asyncpg driver URL."""
    return url.replace("postgresql://", "postgresql+asyncpg://", 1)


engine = create_async_engine(
    _async_url(settings.DATABASE_URL),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Create backup tables if they do not exist yet."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
