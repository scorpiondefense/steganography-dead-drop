use thiserror::Error;

#[derive(Debug, Error)]
pub enum StegError {
    #[error("message too large: need {needed} bits but image has capacity for {capacity} bits")]
    MessageTooLarge { needed: usize, capacity: usize },

    #[error("image error: {0}")]
    Image(#[from] image::ImageError),

    #[error("no hidden message found (magic marker mismatch)")]
    NoMessageFound,

    #[error("invalid message length encoded in header")]
    InvalidLength,

    #[error("UTF-8 decode error: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),

    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}
