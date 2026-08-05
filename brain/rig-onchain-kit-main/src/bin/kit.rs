#[cfg(feature = "http")]
use {
    privy::{config::PrivyConfig, Privy},
    rig_onchain_kit::http::server::run_server,
};

#[cfg(feature = "http")]
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Initialize Privy client
    let privy_client = match PrivyConfig::from_env() {
        Ok(config) => Some(Privy::new(config)),
        Err(e) => {
            tracing::warn!(
                "Privy configuration not found; authenticated routes will reject requests: {}",
                e
            );
            None
        }
    };

    // Run server with just the Privy client
    // Agents will be created dynamically based on requests
    run_server(privy_client).await
}

#[cfg(not(feature = "http"))]
fn main() {
    println!("This binary requires the 'http' feature");
}
