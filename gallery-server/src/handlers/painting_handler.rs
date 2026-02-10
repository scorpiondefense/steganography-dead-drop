use axum::{
    extract::{Multipart, Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::auth::middleware::AuthUser;
use crate::models::Painting;
use crate::AppState;

#[derive(Deserialize)]
pub struct ListQuery {
    pub search: Option<String>,
    pub medium: Option<String>,
    pub min_price: Option<i64>,
    pub max_price: Option<i64>,
    pub status: Option<String>,
    pub seller_id: Option<String>,
}

#[derive(Serialize)]
pub struct PaintingList {
    pub paintings: Vec<Painting>,
    pub total: i64,
}

pub async fn list_paintings(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> Result<Json<PaintingList>, (StatusCode, String)> {
    let mut sql = String::from(
        "SELECT * FROM paintings WHERE status = ?",
    );
    let status = query.status.as_deref().unwrap_or("active");
    let mut count_sql = String::from(
        "SELECT COUNT(*) FROM paintings WHERE status = ?",
    );

    if query.search.is_some() {
        sql.push_str(" AND (title LIKE ? OR description LIKE ? OR artist LIKE ?)");
        count_sql.push_str(" AND (title LIKE ? OR description LIKE ? OR artist LIKE ?)");
    }
    if query.medium.is_some() {
        sql.push_str(" AND medium = ?");
        count_sql.push_str(" AND medium = ?");
    }
    if query.min_price.is_some() {
        sql.push_str(" AND price_cents >= ?");
        count_sql.push_str(" AND price_cents >= ?");
    }
    if query.max_price.is_some() {
        sql.push_str(" AND price_cents <= ?");
        count_sql.push_str(" AND price_cents <= ?");
    }
    if query.seller_id.is_some() {
        sql.push_str(" AND seller_id = ?");
        count_sql.push_str(" AND seller_id = ?");
    }

    sql.push_str(" ORDER BY created_at DESC");

    // Build the queries with dynamic bindings
    let mut q = sqlx::query_as::<_, Painting>(&sql).bind(status);
    let mut cq = sqlx::query_scalar::<_, i64>(&count_sql).bind(status);

    if let Some(ref search) = query.search {
        let pattern = format!("%{}%", search);
        q = q.bind(pattern.clone()).bind(pattern.clone()).bind(pattern.clone());
        cq = cq.bind(pattern.clone()).bind(pattern.clone()).bind(pattern);
    }
    if let Some(ref medium) = query.medium {
        q = q.bind(medium.clone());
        cq = cq.bind(medium.clone());
    }
    if let Some(min_price) = query.min_price {
        q = q.bind(min_price);
        cq = cq.bind(min_price);
    }
    if let Some(max_price) = query.max_price {
        q = q.bind(max_price);
        cq = cq.bind(max_price);
    }
    if let Some(ref seller_id) = query.seller_id {
        q = q.bind(seller_id.clone());
        cq = cq.bind(seller_id.clone());
    }

    let paintings = q
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total = cq
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(PaintingList { paintings, total }))
}

pub async fn get_painting(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Painting>, (StatusCode, String)> {
    let painting = sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Painting not found".into()))?;

    Ok(Json(painting))
}

pub async fn create_painting(
    State(state): State<AppState>,
    auth: AuthUser,
    mut multipart: Multipart,
) -> Result<Json<Painting>, (StatusCode, String)> {
    let mut title = String::new();
    let mut description = String::new();
    let mut artist = String::new();
    let mut medium = String::new();
    let mut price_cents: i64 = 0;
    let mut image_data: Option<Vec<u8>> = None;
    let mut image_filename = String::new();

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "title" => {
                title = field
                    .text()
                    .await
                    .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            }
            "description" => {
                description = field
                    .text()
                    .await
                    .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            }
            "artist" => {
                artist = field
                    .text()
                    .await
                    .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            }
            "medium" => {
                medium = field
                    .text()
                    .await
                    .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
            }
            "price_cents" => {
                let val = field
                    .text()
                    .await
                    .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
                price_cents = val
                    .parse()
                    .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid price".into()))?;
            }
            "image" => {
                image_filename = field
                    .file_name()
                    .unwrap_or("image.png")
                    .to_string();
                image_data = Some(
                    field
                        .bytes()
                        .await
                        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?
                        .to_vec(),
                );
            }
            _ => {}
        }
    }

    let image_data = image_data.ok_or((StatusCode::BAD_REQUEST, "Image is required".into()))?;

    if title.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Title is required".into()));
    }

    let id = uuid::Uuid::new_v4().to_string();

    // Determine extension
    let ext = std::path::Path::new(&image_filename)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");

    let image_filename = format!("{}.{}", id, ext);
    let image_path = format!("uploads/{}", image_filename);
    let full_path = format!("{}/{}", state.upload_dir, image_filename);

    // Save image
    tokio::fs::write(&full_path, &image_data)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Generate thumbnail
    let thumbnail_path = generate_thumbnail(&full_path, &state.upload_dir, &id)
        .await
        .ok()
        .map(|p| format!("uploads/{}", p));

    sqlx::query(
        "INSERT INTO paintings (id, seller_id, title, description, artist, medium, price_cents, image_path, thumbnail_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&auth.user_id)
    .bind(&title)
    .bind(&description)
    .bind(&artist)
    .bind(&medium)
    .bind(price_cents)
    .bind(&image_path)
    .bind(&thumbnail_path)
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

async fn generate_thumbnail(
    image_path: &str,
    upload_dir: &str,
    id: &str,
) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let img = image::open(image_path)?;
    let thumb = img.thumbnail(400, 400);
    let thumb_filename = format!("{}_thumb.png", id);
    let thumb_path = format!("{}/{}", upload_dir, thumb_filename);
    thumb.save(&thumb_path)?;
    Ok(thumb_filename)
}

#[derive(Deserialize)]
pub struct UpdatePainting {
    pub title: Option<String>,
    pub description: Option<String>,
    pub artist: Option<String>,
    pub medium: Option<String>,
    pub price_cents: Option<i64>,
    pub status: Option<String>,
}

pub async fn update_painting(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(body): Json<UpdatePainting>,
) -> Result<Json<Painting>, (StatusCode, String)> {
    let painting = sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Painting not found".into()))?;

    // Only seller or admin can update
    if painting.seller_id != auth.user_id && auth.role != "admin" {
        return Err((StatusCode::FORBIDDEN, "Not authorized".into()));
    }

    let title = body.title.unwrap_or(painting.title);
    let description = body.description.unwrap_or(painting.description);
    let artist = body.artist.unwrap_or(painting.artist);
    let medium = body.medium.unwrap_or(painting.medium);
    let price_cents = body.price_cents.unwrap_or(painting.price_cents);
    let status = body.status.unwrap_or(painting.status);

    sqlx::query(
        "UPDATE paintings SET title = ?, description = ?, artist = ?, medium = ?, price_cents = ?, status = ?, updated_at = datetime('now') WHERE id = ?",
    )
    .bind(&title)
    .bind(&description)
    .bind(&artist)
    .bind(&medium)
    .bind(price_cents)
    .bind(&status)
    .bind(&id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let updated = sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
        .bind(&id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(updated))
}

pub async fn delete_painting(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let painting = sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
        .bind(&id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Painting not found".into()))?;

    if painting.seller_id != auth.user_id && auth.role != "admin" {
        return Err((StatusCode::FORBIDDEN, "Not authorized".into()));
    }

    sqlx::query("DELETE FROM paintings WHERE id = ?")
        .bind(&id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}
