use std::net::SocketAddr;

use sqlx::sqlite::SqlitePool;
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::services::ServeDir;
use tracing_subscriber::EnvFilter;

mod auth;
mod db;
mod handlers;
mod models;
mod routes;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub jwt_secret: String,
    pub upload_dir: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env().add_directive("gallery_server=info".parse()?))
        .init();

    let database_url =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:gallery.db?mode=rwc".into());
    let jwt_secret =
        std::env::var("JWT_SECRET").unwrap_or_else(|_| "super-secret-change-me".into());
    let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "uploads".into());
    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "3001".into())
        .parse()?;

    // Create upload directory
    tokio::fs::create_dir_all(&upload_dir).await?;

    let pool = db::init_pool(&database_url).await?;

    let state = AppState {
        db: pool,
        jwt_secret,
        upload_dir: upload_dir.clone(),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = routes::create_router()
        .with_state(state)
        .nest_service("/uploads", ServeDir::new(&upload_dir))
        .layer(cors)
        .layer(RequestBodyLimitLayer::new(50 * 1024 * 1024)); // 50MB

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Gallery server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
