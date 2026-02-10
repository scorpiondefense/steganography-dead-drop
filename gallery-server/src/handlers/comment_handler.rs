use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;

use crate::auth::middleware::AuthUser;
use crate::models::Comment;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateComment {
    pub content: String,
    pub parent_id: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateComment {
    pub content: Option<String>,
}

pub async fn list_comments(
    State(state): State<AppState>,
    Path(painting_id): Path<String>,
) -> Result<Json<Vec<Comment>>, (StatusCode, String)> {
    let comments = sqlx::query_as::<_, Comment>(
        "SELECT * FROM comments WHERE painting_id = ? AND status = 'visible' ORDER BY created_at ASC",
    )
    .bind(&painting_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(comments))
}

pub async fn create_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(painting_id): Path<String>,
    Json(body): Json<CreateComment>,
) -> Result<Json<Comment>, (StatusCode, String)> {
    // Verify painting exists
    let exists = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM paintings WHERE id = ?")
        .bind(&painting_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if exists == 0 {
        return Err((StatusCode::NOT_FOUND, "Painting not found".into()));
    }

    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO comments (id, painting_id, user_id, content, parent_id) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&painting_id)
    .bind(&auth.user_id)
    .bind(&body.content)
    .bind(&body.parent_id)
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

pub async fn update_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(body): Json<UpdateComment>,
) -> Result<Json<Comment>, (StatusCode, String)> {
    let comment = sqlx::query_as::<_, Comment>("SELECT * FROM comments WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Comment not found".into()))?;

    if comment.user_id != auth.user_id && auth.role != "admin" {
        return Err((StatusCode::FORBIDDEN, "Not authorized".into()));
    }

    if let Some(content) = body.content {
        sqlx::query("UPDATE comments SET content = ?, updated_at = datetime('now') WHERE id = ?")
            .bind(&content)
            .bind(&id)
            .execute(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    let updated = sqlx::query_as::<_, Comment>("SELECT * FROM comments WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

pub async fn delete_comment(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let comment = sqlx::query_as::<_, Comment>("SELECT * FROM comments WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Comment not found".into()))?;

    if comment.user_id != auth.user_id && auth.role != "admin" {
        return Err((StatusCode::FORBIDDEN, "Not authorized".into()));
    }

    sqlx::query("DELETE FROM comments WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}
