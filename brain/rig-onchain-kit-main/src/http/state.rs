use privy::Privy;
use std::sync::Arc;

pub struct AppState {
    pub(crate) privy: Option<Arc<Privy>>,
}

impl AppState {
    pub fn new(privy: Option<Privy>) -> Self {
        Self {
            privy: privy.map(Arc::new),
        }
    }

    pub(crate) fn privy(&self) -> anyhow::Result<Arc<Privy>> {
        self.privy
            .clone()
            .ok_or_else(|| anyhow::anyhow!("Privy is not configured"))
    }
}
