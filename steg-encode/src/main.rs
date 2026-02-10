use clap::Parser;
use image::ImageFormat;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(name = "steg-encode", about = "Encode a hidden message into a PNG image")]
struct Args {
    /// Input PNG image path
    #[arg(short, long)]
    input: PathBuf,

    /// Output PNG image path
    #[arg(short, long)]
    output: PathBuf,

    /// Message to encode (text)
    #[arg(short, long, conflicts_with = "message_file")]
    message: Option<String>,

    /// File containing the message to encode
    #[arg(long, conflicts_with = "message")]
    message_file: Option<PathBuf>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let message_bytes = match (&args.message, &args.message_file) {
        (Some(msg), _) => msg.as_bytes().to_vec(),
        (_, Some(path)) => std::fs::read(path)?,
        (None, None) => {
            eprintln!("Error: provide either --message or --message-file");
            std::process::exit(1);
        }
    };

    let img = image::open(&args.input)?;
    let cap = steg_core::capacity(&img);
    eprintln!(
        "Image capacity: {} bytes, message size: {} bytes",
        cap,
        message_bytes.len()
    );

    let encoded = steg_core::encode(&img, &message_bytes)?;
    encoded.save_with_format(&args.output, ImageFormat::Png)?;
    eprintln!("Message encoded successfully into {:?}", args.output);

    Ok(())
}
