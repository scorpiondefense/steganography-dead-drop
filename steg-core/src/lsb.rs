use image::{DynamicImage, GenericImageView, RgbaImage};

use crate::error::StegError;

/// Magic marker bytes: 0xDEAD (2 bytes = 16 bits)
const MAGIC: [u8; 2] = [0xDE, 0xAD];

/// Header size: 2 bytes magic + 4 bytes u32 length = 6 bytes = 48 bits
const HEADER_BYTES: usize = 6;

/// Calculate the steganographic capacity of an image in bytes.
/// We use 1 bit per channel (R, G, B) per pixel = 3 bits per pixel.
pub fn capacity(img: &DynamicImage) -> usize {
    let (w, h) = img.dimensions();
    let total_bits = (w as usize) * (h as usize) * 3; // 3 channels
    let total_bytes = total_bits / 8;
    total_bytes.saturating_sub(HEADER_BYTES)
}

/// Encode a message into an image using LSB steganography.
/// Format: [0xDE, 0xAD] [u32 big-endian length] [message bytes]
/// Each bit is stored in the LSB of one color channel (R, G, B only).
pub fn encode(img: &DynamicImage, message: &[u8]) -> Result<RgbaImage, StegError> {
    let cap = capacity(img);
    if message.len() > cap {
        return Err(StegError::MessageTooLarge {
            needed: (HEADER_BYTES + message.len()) * 8,
            capacity: cap * 8,
        });
    }

    // Build the payload: magic + length + message
    let len_bytes = (message.len() as u32).to_be_bytes();
    let mut payload = Vec::with_capacity(HEADER_BYTES + message.len());
    payload.extend_from_slice(&MAGIC);
    payload.extend_from_slice(&len_bytes);
    payload.extend_from_slice(message);

    // Convert payload to bits
    let bits: Vec<u8> = payload
        .iter()
        .flat_map(|byte| (0..8).rev().map(move |i| (byte >> i) & 1))
        .collect();

    let (w, h) = img.dimensions();
    let mut output = img.to_rgba8();
    let mut bit_idx = 0;

    'outer: for y in 0..h {
        for x in 0..w {
            let pixel = output.get_pixel_mut(x, y);
            // Only modify R, G, B channels (indices 0, 1, 2), skip alpha
            for ch in 0..3 {
                if bit_idx >= bits.len() {
                    break 'outer;
                }
                pixel[ch] = (pixel[ch] & 0xFE) | bits[bit_idx];
                bit_idx += 1;
            }
        }
    }

    Ok(output)
}

/// Decode a hidden message from an image.
/// Returns the raw message bytes.
pub fn decode(img: &DynamicImage) -> Result<Vec<u8>, StegError> {
    let (w, h) = img.dimensions();

    // Extract all LSBs from R, G, B channels
    let mut bits: Vec<u8> = Vec::new();
    for y in 0..h {
        for x in 0..w {
            let pixel = img.get_pixel(x, y);
            for ch in 0..3 {
                bits.push(pixel[ch] & 1);
            }
        }
    }

    // We need at least HEADER_BYTES * 8 bits
    let header_bits = HEADER_BYTES * 8;
    if bits.len() < header_bits {
        return Err(StegError::NoMessageFound);
    }

    // Extract bytes from bits
    let extract_bytes = |bit_slice: &[u8]| -> Vec<u8> {
        bit_slice
            .chunks(8)
            .filter(|chunk| chunk.len() == 8)
            .map(|chunk| {
                chunk
                    .iter()
                    .fold(0u8, |acc, &bit| (acc << 1) | bit)
            })
            .collect()
    };

    // Check magic marker
    let magic_bytes = extract_bytes(&bits[0..16]);
    if magic_bytes != MAGIC {
        return Err(StegError::NoMessageFound);
    }

    // Extract length (4 bytes = 32 bits, starting at bit 16)
    let len_bytes = extract_bytes(&bits[16..48]);
    if len_bytes.len() < 4 {
        return Err(StegError::InvalidLength);
    }
    let msg_len = u32::from_be_bytes([len_bytes[0], len_bytes[1], len_bytes[2], len_bytes[3]]) as usize;

    // Validate length
    let total_needed_bits = (HEADER_BYTES + msg_len) * 8;
    if total_needed_bits > bits.len() {
        return Err(StegError::InvalidLength);
    }

    // Extract message bytes
    let msg_start = 48; // HEADER_BYTES * 8
    let msg_bits = &bits[msg_start..msg_start + msg_len * 8];
    let message = extract_bytes(msg_bits);

    Ok(message)
}

/// Decode a hidden message and return it as a UTF-8 string.
pub fn decode_string(img: &DynamicImage) -> Result<String, StegError> {
    let bytes = decode(img)?;
    Ok(String::from_utf8(bytes)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::DynamicImage;

    fn create_test_image(w: u32, h: u32) -> DynamicImage {
        DynamicImage::ImageRgba8(RgbaImage::from_fn(w, h, |_, _| {
            image::Rgba([128, 128, 128, 255])
        }))
    }

    #[test]
    fn test_capacity() {
        let img = create_test_image(100, 100);
        let cap = capacity(&img);
        // 100*100 pixels * 3 bits/pixel = 30000 bits = 3750 bytes - 6 header = 3744
        assert_eq!(cap, 3744);
    }

    #[test]
    fn test_encode_decode_roundtrip() {
        let img = create_test_image(100, 100);
        let message = b"Hello, steganography!";
        let encoded = encode(&img, message).unwrap();
        let encoded_dyn = DynamicImage::ImageRgba8(encoded);
        let decoded = decode(&encoded_dyn).unwrap();
        assert_eq!(decoded, message);
    }

    #[test]
    fn test_encode_decode_string_roundtrip() {
        let img = create_test_image(200, 200);
        let message = "Secret dead drop message: rendezvous at 0300 hours";
        let encoded = encode(&img, message.as_bytes()).unwrap();
        let encoded_dyn = DynamicImage::ImageRgba8(encoded);
        let decoded = decode_string(&encoded_dyn).unwrap();
        assert_eq!(decoded, message);
    }

    #[test]
    fn test_message_too_large() {
        let img = create_test_image(2, 2); // Very small image
        let message = vec![0u8; 1000];
        let result = encode(&img, &message);
        assert!(matches!(result, Err(StegError::MessageTooLarge { .. })));
    }

    #[test]
    fn test_no_message_found() {
        let img = create_test_image(100, 100); // Clean image, no embedded data
        let result = decode(&img);
        assert!(matches!(result, Err(StegError::NoMessageFound)));
    }

    #[test]
    fn test_empty_message() {
        let img = create_test_image(100, 100);
        let message = b"";
        let encoded = encode(&img, message).unwrap();
        let encoded_dyn = DynamicImage::ImageRgba8(encoded);
        let decoded = decode(&encoded_dyn).unwrap();
        assert_eq!(decoded, message);
    }

    #[test]
    fn test_binary_data() {
        let img = create_test_image(100, 100);
        let message: Vec<u8> = (0..=255).collect();
        let encoded = encode(&img, &message).unwrap();
        let encoded_dyn = DynamicImage::ImageRgba8(encoded);
        let decoded = decode(&encoded_dyn).unwrap();
        assert_eq!(decoded, message);
    }
}
