"""Application settings management."""
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralized runtime configuration."""

    model_config = SettingsConfigDict(
        env_file=(
            Path(__file__).resolve().parents[1] / ".env",
            Path(__file__).resolve().parents[2] / ".env",
            ".env",
        ),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(default="sqlite:///./rtiis.db", env="DATABASE_URL")
    openai_api_key: str | None = Field(default=None, env="OPENAI_API_KEY")
    llm_provider: str = Field(default="openai", env="LLM_PROVIDER")


settings = Settings()
