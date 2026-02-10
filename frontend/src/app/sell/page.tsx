"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Painting } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export default function SellPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [artist, setArtist] = useState("");
  const [medium, setMedium] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  if (!user) {
    return (
      <div className="text-center py-24 text-gray-400">
        Please log in to sell paintings.
      </div>
    );
  }

  const handleFile = (f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image");
      return;
    }
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("artist", artist);
    formData.append("medium", medium);
    formData.append("price_cents", String(Math.round(Number(price) * 100)));
    formData.append("image", file);

    try {
      const painting = await api.upload<Painting>("/api/paintings", formData);
      router.push(`/paintings/${painting.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-surface-900">
          List a Painting
        </h1>
        <p className="text-gray-500 mt-1">
          Upload your artwork and set your price
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? "border-brand-500 bg-brand-50"
              : preview
              ? "border-surface-200 bg-white"
              : "border-surface-200 hover:border-brand-400 hover:bg-brand-50/30"
          }`}
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="max-h-72 mx-auto rounded-lg"
            />
          ) : (
            <div className="py-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-surface-700">
                Drop your image here or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, or WebP &mdash; max 50MB
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Artist
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Medium
            </label>
            <select
              value={medium}
              onChange={(e) => setMedium(e.target.value)}
              className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            >
              <option value="">Select...</option>
              <option value="oil">Oil</option>
              <option value="acrylic">Acrylic</option>
              <option value="watercolor">Watercolor</option>
              <option value="digital">Digital</option>
              <option value="mixed">Mixed Media</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Price ($) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-surface-900 text-white py-3.5 rounded-xl font-semibold hover:bg-surface-800 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? "Uploading..." : "List Painting"}
        </button>
      </form>
    </div>
  );
}
