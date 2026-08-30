import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    PROJECT_NAME: str = "Skylark Drones - Monday.com BI Agent"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Monday.com Config
    MONDAY_API_KEY: str = ""
    MONDAY_API_URL: str = "https://api.monday.com/v2"
    MONDAY_DEALS_BOARD_ID: str = ""
    MONDAY_WORK_ORDERS_BOARD_ID: str = ""

    # LLM Config (Groq AI & Ollama)
    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    
    # Optional Local Ollama Config
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
