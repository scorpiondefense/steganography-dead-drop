use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::auth::middleware::AdminUser;
use crate::models::{Comment, Order, Painting, User};
use crate::AppState;

#[derive(Serialize)]
pub struct AdminStats {
    pub total_users: i64,
    pub total_paintings: i64,
    pub total_orders: i64,
    pub total_comments: i64,
    pub total_revenue_cents: i64,
    pub steg_paintings: i64,
}

pub async fn get_stats(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<AdminStats>, (StatusCode, String)> {
    let total_users = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users")
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_paintings = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM paintings")
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_orders = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM orders")
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_comments = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM comments")
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total_revenue_cents =
        sqlx::query_scalar::<_, Option<i64>>("SELECT SUM(total_cents) FROM orders")
            .fetch_one(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
            .unwrap_or(0);

    let steg_paintings =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM paintings WHERE has_steg_message = 1")
            .fetch_one(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(AdminStats {
        total_users,
        total_paintings,
        total_orders,
        total_comments,
        total_revenue_cents,
        steg_paintings,
    }))
}

// User management
pub async fn list_users(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<Vec<crate::models::UserPublic>>, (StatusCode, String)> {
    let users = sqlx::query_as::<_, User>("SELECT * FROM users ORDER BY created_at DESC")
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(users.into_iter().map(Into::into).collect()))
}

#[derive(Deserialize)]
pub struct UpdateUserRole {
    pub role: String,
}

pub async fn update_user_role(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(user_id): Path<String>,
    Json(body): Json<UpdateUserRole>,
) -> Result<Json<crate::models::UserPublic>, (StatusCode, String)> {
    if body.role != "customer" && body.role != "admin" {
        return Err((StatusCode::BAD_REQUEST, "Invalid role".into()));
    }

    sqlx::query("UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(&body.role)
        .bind(&user_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&user_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(user.into()))
}

// Painting management (admin sees all)
pub async fn list_all_paintings(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<Vec<Painting>>, (StatusCode, String)> {
    let paintings = sqlx::query_as::<_, Painting>(
        "SELECT * FROM paintings ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(paintings))
}

#[derive(Deserialize)]
pub struct UpdatePaintingStatus {
    pub status: String,
}

pub async fn update_painting_status(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<String>,
    Json(body): Json<UpdatePaintingStatus>,
) -> Result<Json<Painting>, (StatusCode, String)> {
    sqlx::query("UPDATE paintings SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(&body.status)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let painting = sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(painting))
}

// Comment management
pub async fn list_all_comments(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<Vec<Comment>>, (StatusCode, String)> {
    let comments = sqlx::query_as::<_, Comment>(
        "SELECT * FROM comments ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(comments))
}

#[derive(Deserialize)]
pub struct UpdateCommentStatus {
    pub status: String,
}

pub async fn update_comment_status(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<String>,
    Json(body): Json<UpdateCommentStatus>,
) -> Result<Json<Comment>, (StatusCode, String)> {
    if !["visible", "hidden", "flagged"].contains(&body.status.as_str()) {
        return Err((StatusCode::BAD_REQUEST, "Invalid status".into()));
    }

    sqlx::query("UPDATE comments SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(&body.status)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let comment = sqlx::query_as::<_, Comment>("SELECT * FROM comments WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(comment))
}

// Order management
pub async fn list_all_orders(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<Vec<Order>>, (StatusCode, String)> {
    let orders = sqlx::query_as::<_, Order>(
        "SELECT * FROM orders ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(orders))
}

#[derive(Deserialize)]
pub struct UpdateOrderStatus {
    pub status: String,
}

pub async fn update_order_status(
    State(state): State<AppState>,
    _admin: AdminUser,
    Path(id): Path<String>,
    Json(body): Json<UpdateOrderStatus>,
) -> Result<Json<Order>, (StatusCode, String)> {
    if !["pending", "confirmed", "shipped", "delivered", "cancelled"]
        .contains(&body.status.as_str())
    {
        return Err((StatusCode::BAD_REQUEST, "Invalid status".into()));
    }

    sqlx::query("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(&body.status)
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let order = sqlx::query_as::<_, Order>("SELECT * FROM orders WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(order))
}
