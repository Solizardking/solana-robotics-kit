use actix_cors::Cors;
use actix_web::middleware::{Compress, Logger};
use actix_web::{web, App, HttpServer};
use privy::Privy;
use std::env;

use super::routes::{auth, healthz, stream};
use super::state::AppState;

pub async fn run_server(privy: Option<Privy>) -> std::io::Result<()> {
    let state = web::Data::new(AppState::new(privy));
    let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let port = env::var("PORT").unwrap_or_else(|_| "6969".to_string());
    let bind_addr = format!("{}:{}", host, port);

    tracing::info!("starting HTTP server on {}", bind_addr);

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(Compress::default())
            .wrap(Cors::permissive())
            .app_data(state.clone())
            .service(healthz)
            .service(web::scope("/v1").service(stream).service(auth))
    })
    .bind(bind_addr)?
    .run()
    .await
}
