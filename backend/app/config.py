from pydantic_settings import BaseSettings, SettingsConfigDict


class AppConfig(BaseSettings):
    database_url: str = "sqlite:///./resiliops.db"
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env")


config = AppConfig()