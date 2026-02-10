use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use image::ImageFormat;
use serde::{Deserialize, Serialize};

use crate::auth::middleware::AdminUser;
use crate::models::{Painting, StegMessage};
use crate::AppState;

#[derive(Serialize)]
pub struct DecodeResponse {
    pub message: String,
    pub painting_id: String,
    pub steg_message: StegMessage,
}

pub async fn decode_painting(
    State(state): State<AppState>,
    admin: AdminUser,
    Path(painting_id): Path<String>,
) -> Result<Json<DecodeResponse>, (StatusCode, String)> {
    let painting = sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
        .bind(&painting_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Painting not found".into()))?;

    // Load the image from disk
    let image_full_path = painting.image_path.replace("uploads/", &format!("{}/", state.upload_dir));
    let img = image::open(&image_full_path)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to open image: {}", e)))?;

    // Try to decode
    let message = steg_core::decode_string(&img)
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("No hidden message found: {}", e)))?;

    // Store the decoded message
    let msg_id = uuid::Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO steg_messages (id, painting_id, direction, message_text, decoded_by) VALUES (?, ?, 'incoming', ?, ?)",
    )
    .bind(&msg_id)
    .bind(&painting_id)
    .bind(&message)
    .bind(&admin.user_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Mark painting as having steg message decoded
    sqlx::query(
        "UPDATE paintings SET has_steg_message = 1, steg_decoded = 1, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(&painting_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let steg_message = sqlx::query_as::<_, StegMessage>("SELECT * FROM steg_messages WHERE id = ?")
        .bind(&msg_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(DecodeResponse {
        message,
        painting_id,
        steg_message,
    }))
}

#[derive(Deserialize)]
pub struct EncodeRequest {
    pub painting_id: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct EncodeResponse {
    pub success: bool,
    pub painting_id: String,
    pub steg_message: StegMessage,
}

pub async fn encode_painting(
    State(state): State<AppState>,
    admin: AdminUser,
    Json(body): Json<EncodeRequest>,
) -> Result<Json<EncodeResponse>, (StatusCode, String)> {
    let painting = sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
        .bind(&body.painting_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Painting not found".into()))?;

    // Load the image
    let image_full_path = painting.image_path.replace("uploads/", &format!("{}/", state.upload_dir));
    let img = image::open(&image_full_path)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to open image: {}", e)))?;

    // Encode the message
    let encoded = steg_core::encode(&img, body.message.as_bytes())
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Encoding failed: {}", e)))?;

    // Save the encoded image back (overwrite)
    encoded
        .save_with_format(&image_full_path, ImageFormat::Png)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save image: {}", e)))?;

    // Store the message record
    let msg_id = uuid::Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO steg_messages (id, painting_id, direction, message_text, encoded_by) VALUES (?, ?, 'outgoing', ?, ?)",
    )
    .bind(&msg_id)
    .bind(&body.painting_id)
    .bind(&body.message)
    .bind(&admin.user_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Mark painting as having steg message
    sqlx::query(
        "UPDATE paintings SET has_steg_message = 1, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(&body.painting_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let steg_message = sqlx::query_as::<_, StegMessage>("SELECT * FROM steg_messages WHERE id = ?")
        .bind(&msg_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(EncodeResponse {
        success: true,
        painting_id: body.painting_id,
        steg_message,
    }))
}

pub async fn list_messages(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<Vec<StegMessage>>, (StatusCode, String)> {
    let messages = sqlx::query_as::<_, StegMessage>(
        "SELECT * FROM steg_messages ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(messages))
}
