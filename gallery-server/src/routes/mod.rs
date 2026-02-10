use axum::{
    routing::{delete, get, post, put},
    Router,
};

use crate::handlers::*;
use crate::AppState;

pub fn create_router() -> Router<AppState> {
    let auth_routes = Router::new()
        .route("/register", post(auth_handler::register))
        .route("/login", post(auth_handler::login))
        .route("/me", get(auth_handler::me));

    let painting_routes = Router::new()
        .route("/", get(painting_handler::list_paintings))
        .route("/", post(painting_handler::create_painting))
        .route("/{id}", get(painting_handler::get_painting))
        .route("/{id}", put(painting_handler::update_painting))
        .route("/{id}", delete(painting_handler::delete_painting))
        .route(
            "/{painting_id}/comments",
            get(comment_handler::list_comments),
        )
        .route(
            "/{painting_id}/comments",
            post(comment_handler::create_comment),
        );

    let comment_routes = Router::new()
        .route("/{id}", put(comment_handler::update_comment))
        .route("/{id}", delete(comment_handler::delete_comment));

    let cart_routes = Router::new()
        .route("/", get(cart_handler::list_cart))
        .route("/", post(cart_handler::add_to_cart))
        .route("/", delete(cart_handler::clear_cart))
        .route("/{painting_id}", delete(cart_handler::remove_from_cart));

    let order_routes = Router::new()
        .route("/", get(order_handler::list_orders))
        .route("/checkout", post(order_handler::checkout))
        .route("/{id}", get(order_handler::get_order));

    let admin_routes = Router::new()
        .route("/stats", get(admin_handler::get_stats))
        .route("/users", get(admin_handler::list_users))
        .route("/users/{id}/role", put(admin_handler::update_user_role))
        .route("/paintings", get(admin_handler::list_all_paintings))
        .route(
            "/paintings/{id}/status",
            put(admin_handler::update_painting_status),
        )
        .route("/comments", get(admin_handler::list_all_comments))
        .route(
            "/comments/{id}/status",
            put(admin_handler::update_comment_status),
        )
        .route("/orders", get(admin_handler::list_all_orders))
        .route(
            "/orders/{id}/status",
            put(admin_handler::update_order_status),
        );

    let steg_routes = Router::new()
        .route("/decode/{painting_id}", post(steg_handler::decode_painting))
        .route("/encode", post(steg_handler::encode_painting))
        .route("/messages", get(steg_handler::list_messages));

    Router::new()
        .nest("/api/auth", auth_routes)
        .nest("/api/paintings", painting_routes)
        .nest("/api/comments", comment_routes)
        .nest("/api/cart", cart_routes)
        .nest("/api/orders", order_routes)
        .nest("/api/admin", admin_routes)
        .nest("/api/steg", steg_routes)
}
