use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};

use crate::auth::middleware::AuthUser;
use crate::models::{CartItem, Order, OrderItem, Painting};
use crate::AppState;

#[derive(Deserialize)]
pub struct CheckoutRequest {
    pub shipping_name: String,
    pub shipping_address: String,
    pub shipping_city: String,
    pub shipping_zip: String,
    pub shipping_country: String,
}

#[derive(Serialize)]
pub struct OrderWithItems {
    pub order: Order,
    pub items: Vec<OrderItemWithPainting>,
}

#[derive(Serialize)]
pub struct OrderItemWithPainting {
    pub order_item: OrderItem,
    pub painting: Painting,
}

pub async fn checkout(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<CheckoutRequest>,
) -> Result<Json<OrderWithItems>, (StatusCode, String)> {
    // Get cart items
    let cart_items = sqlx::query_as::<_, CartItem>(
        "SELECT * FROM cart_items WHERE user_id = ?",
    )
    .bind(&auth.user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if cart_items.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Cart is empty".into()));
    }

    // Get paintings and calculate total
    let mut paintings = Vec::new();
    let mut total_cents: i64 = 0;

    for item in &cart_items {
        let painting = sqlx::query_as::<_, Painting>(
            "SELECT * FROM paintings WHERE id = ? AND status = 'active'",
        )
        .bind(&item.painting_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((
            StatusCode::BAD_REQUEST,
            format!("Painting {} is no longer available", item.painting_id),
        ))?;

        total_cents += painting.price_cents;
        paintings.push(painting);
    }

    // Create order
    let order_id = uuid::Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO orders (id, buyer_id, total_cents, shipping_name, shipping_address, shipping_city, shipping_zip, shipping_country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&order_id)
    .bind(&auth.user_id)
    .bind(total_cents)
    .bind(&body.shipping_name)
    .bind(&body.shipping_address)
    .bind(&body.shipping_city)
    .bind(&body.shipping_zip)
    .bind(&body.shipping_country)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Create order items and mark paintings as sold
    let mut items = Vec::new();
    for painting in &paintings {
        let item_id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO order_items (id, order_id, painting_id, price_cents) VALUES (?, ?, ?, ?)",
        )
        .bind(&item_id)
        .bind(&order_id)
        .bind(&painting.id)
        .bind(painting.price_cents)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        // Mark painting as sold
        sqlx::query("UPDATE paintings SET status = 'sold', updated_at = datetime('now') WHERE id = ?")
            .bind(&painting.id)
            .execute(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        items.push(OrderItemWithPainting {
            order_item: OrderItem {
                id: item_id,
                order_id: order_id.clone(),
                painting_id: painting.id.clone(),
                price_cents: painting.price_cents,
            },
            painting: painting.clone(),
        });
    }

    // Clear cart
    sqlx::query("DELETE FROM cart_items WHERE user_id = ?")
        .bind(&auth.user_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let order = sqlx::query_as::<_, Order>("SELECT * FROM orders WHERE id = ?")
        .bind(&order_id)
        .fetch_one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(OrderWithItems { order, items }))
}

pub async fn list_orders(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<Order>>, (StatusCode, String)> {
    let orders = sqlx::query_as::<_, Order>(
        "SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC",
    )
    .bind(&auth.user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(orders))
}

pub async fn get_order(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<OrderWithItems>, (StatusCode, String)> {
    let order = sqlx::query_as::<_, Order>("SELECT * FROM orders WHERE id = ? AND buyer_id = ?")
        .bind(&id)
        .bind(&auth.user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Order not found".into()))?;

    let order_items =
        sqlx::query_as::<_, OrderItem>("SELECT * FROM order_items WHERE order_id = ?")
            .bind(&order.id)
            .fetch_all(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut items = Vec::new();
    for oi in order_items {
        let painting = sqlx::query_as::<_, Painting>("SELECT * FROM paintings WHERE id = ?")
            .bind(&oi.painting_id)
            .fetch_one(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        items.push(OrderItemWithPainting {
            order_item: oi,
            painting,
        });
    }

    Ok(Json(OrderWithItems { order, items }))
}
