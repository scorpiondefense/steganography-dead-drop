use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPublic {
    pub id: String,
    pub username: String,
    pub email: String,
    pub role: String,
    pub created_at: String,
}

impl From<User> for UserPublic {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            created_at: u.created_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Painting {
    pub id: String,
    pub seller_id: String,
    pub title: String,
    pub description: String,
    pub artist: String,
    pub medium: String,
    pub price_cents: i64,
    pub image_path: String,
    pub thumbnail_path: Option<String>,
    pub status: String,
    pub has_steg_message: bool,
    pub steg_decoded: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: String,
    pub buyer_id: String,
    pub total_cents: i64,
    pub status: String,
    pub shipping_name: String,
    pub shipping_address: String,
    pub shipping_city: String,
    pub shipping_zip: String,
    pub shipping_country: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct OrderItem {
    pub id: String,
    pub order_id: String,
    pub painting_id: String,
    pub price_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CartItem {
    pub id: String,
    pub user_id: String,
    pub painting_id: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Comment {
    pub id: String,
    pub painting_id: String,
    pub user_id: String,
    pub content: String,
    pub status: String,
    pub parent_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct StegMessage {
    pub id: String,
    pub painting_id: String,
    pub direction: String,
    pub message_text: String,
    pub decoded_by: Option<String>,
    pub encoded_by: Option<String>,
    pub created_at: String,
}
