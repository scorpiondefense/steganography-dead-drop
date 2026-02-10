use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::auth::middleware::AuthUser;
use crate::models::{CartItem, Painting};
use crate::AppState;

#[derive(Serialize)]
pub struct CartItemWithPainting {
    pub cart_item: CartItem,
    pub painting: Painting,
}

#[derive(Deserialize)]
pub struct AddToCart {
    pub painting_id: String,
}

pub async fn list_cart(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<CartItemWithPainting>>, (StatusCode, String)> {
    let items = sqlx::query_as::<_, CartItem>(
        "SELECT * FROM cart_items WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(&auth.user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut result = Vec::new();
    for item in items {
        let painting =
            sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
                .bind(&item.painting_id)
                .fetch_optional(&state.db)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        if let Some(painting) = painting {
            result.push(CartItemWithPainting {
                cart_item: item,
                painting,
            });
        }
    }

    Ok(Json(result))
}

pub async fn add_to_cart(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<AddToCart>,
) -> Result<Json<CartItem>, (StatusCode, String)> {
    // Check painting exists and is active
    let painting = sqlx::query_as::<_, Painting>(
        "SELECT * FROM paintings WHERE id = ? AND status = 'active'",
    )
    .bind(&body.painting_id)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Painting not found or not available".into()))?;

    // Don't let users buy their own paintings
    if painting.seller_id == auth.user_id {
        return Err((StatusCode::BAD_REQUEST, "Cannot add your own painting to cart".into()));
    }

    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query("INSERT OR IGNORE INTO cart_items (id, user_id, painting_id) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(&auth.user_id)
        .bind(&body.painting_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let item = sqlx::query_as::<_, CartItem>(
        "SELECT * FROM cart_items WHERE user_id = ? AND painting_id = ?",
    )
    .bind(&auth.user_id)
    .bind(&body.painting_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(item))
}

pub async fn remove_from_cart(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(painting_id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query("DELETE FROM cart_items WHERE user_id = ? AND painting_id = ?")
        .bind(&auth.user_id)
        .bind(&painting_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn clear_cart(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<StatusCode, (StatusCode, String)> {
    sqlx::query("DELETE FROM cart_items WHERE user_id = ?")
        .bind(&auth.user_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}
