# Steganography Dead Drop

Hide secret messages inside PNG images using Least Significant Bit (LSB) encoding. Includes CLI tools, a gallery REST API, and a web frontend.

## Features

- **LSB steganography** — 1 bit per RGB channel (3 bits per pixel)
- **Magic marker validation** — 0xDEAD header for message detection
- **Capacity calculation** — dynamic storage based on image dimensions
- **Gallery server** — REST API with JWT auth, SQLite database, image uploads
- **Web UI** — Next.js frontend for browsing and managing encoded images

## Project Structure

```
steg-core/        # LSB encoding/decoding library
steg-encode/      # CLI: encode messages into images
steg-decode/      # CLI: decode messages from images
gallery-server/   # Axum REST API with auth & database
frontend/         # Next.js web UI
```

## Building

### CLI Tools (Rust)

```bash
cargo build --release
```

Produces `target/release/steg-encode` and `target/release/steg-decode`.

### Gallery Server

```bash
cargo build --release --bin gallery-server
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

## Usage

### Encode a message

```bash
./target/release/steg-encode --input photo.png --output encoded.png --message "secret text"
```

### Decode a message

```bash
./target/release/steg-decode --input encoded.png
```

### Run the gallery server

```bash
cp .env.example .env
./target/release/gallery-server
```

## Dependencies

**Rust:**
- image 0.25 — PNG handling
- axum 0.8 — web framework (gallery server)
- sqlx 0.8 — SQLite (gallery server)
- jsonwebtoken 9 — JWT authentication
- argon2 0.5 — password hashing
- clap 4 — CLI parsing
- tokio 1 — async runtime

**Frontend:**
- Next.js 15, React 19, Tailwind CSS 4

## Docker

```bash
docker build -t steg-dead-drop .
docker run -p 3000:3000 steg-dead-drop
```

## License

BSD 2-Clause
