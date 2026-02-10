use clap::Parser;
use std::path::PathBuf;

#[derive(Parser, Debug)]
#[command(name = "steg-decode", about = "Decode a hidden message from a PNG image")]
struct Args {
    /// Input PNG image with hidden message
    #[arg(short, long)]
    input: PathBuf,

    /// Optional output file to write the decoded message to
    #[arg(short, long)]
    output: Option<PathBuf>,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    let img = image::open(&args.input)?;
    let message_bytes = steg_core::decode(&img)?;

    match args.output {
        Some(path) => {
            std::fs::write(&path, &message_bytes)?;
            eprintln!("Decoded message written to {:?}", path);
        }
        None => {
            // Try to print as UTF-8, fall back to hex dump
            match String::from_utf8(message_bytes.clone()) {
                Ok(text) => println!("{}", text),
                Err(_) => {
                    eprintln!("Message is not valid UTF-8, printing hex:");
                    for byte in &message_bytes {
                        print!("{:02x}", byte);
                    }
                    println!();
                }
            }
        }
    }

    Ok(())
}
