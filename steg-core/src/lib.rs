pub mod error;
pub mod lsb;

pub use error::StegError;
pub use lsb::{capacity, decode, decode_string, encode};
