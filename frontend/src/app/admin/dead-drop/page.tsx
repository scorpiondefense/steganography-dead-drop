"use client";

import { useEffect, useState } from "react";
import { api, imageUrl } from "@/lib/api";
import {
  Painting,
  StegMessage,
  DecodeResponse,
  EncodeResponse,
} from "@/lib/types";

export default function DeadDropPage() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [messages, setMessages] = useState<StegMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [decodePaintingId, setDecodePaintingId] = useState("");
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState("");

  const [encodePaintingId, setEncodePaintingId] = useState("");
  const [encodeMessage, setEncodeMessage] = useState("");
  const [encoding, setEncoding] = useState(false);
  const [encodeSuccess, setEncodeSuccess] = useState(false);
  const [encodeError, setEncodeError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<Painting[]>("/api/admin/paintings"),
      api.get<StegMessage[]>("/api/steg/messages"),
    ])
      .then(([p, m]) => {
        setPaintings(p);
        setMessages(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDecode = async () => {
    if (!decodePaintingId) return;
    setDecoding(true);
    setDecodedMessage(null);
    setDecodeError("");
    try {
      const res = await api.post<DecodeResponse>(
        `/api/steg/decode/${decodePaintingId}`
      );
      setDecodedMessage(res.message);
      setMessages((prev) => [res.steg_message, ...prev]);
      setPaintings((prev) =>
        prev.map((p) =>
          p.id === decodePaintingId
            ? { ...p, has_steg_message: true, steg_decoded: true }
            : p
        )
      );
    } catch (err) {
      setDecodeError(err instanceof Error ? err.message : "Decode failed");
    } finally {
      setDecoding(false);
    }
  };

  const handleEncode = async () => {
    if (!encodePaintingId || !encodeMessage) return;
    setEncoding(true);
    setEncodeSuccess(false);
    setEncodeError("");
    try {
      const res = await api.post<EncodeResponse>("/api/steg/encode", {
        painting_id: encodePaintingId,
        message: encodeMessage,
      });
      setEncodeSuccess(true);
      setEncodeMessage("");
      setMessages((prev) => [res.steg_message, ...prev]);
      setPaintings((prev) =>
        prev.map((p) =>
          p.id === encodePaintingId ? { ...p, has_steg_message: true } : p
        )
      );
    } catch (err) {
      setEncodeError(err instanceof Error ? err.message : "Encode failed");
    } finally {
      setEncoding(false);
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  const selectedDecodePainting = paintings.find(
    (p) => p.id === decodePaintingId
  );
  const selectedEncodePainting = paintings.find(
    (p) => p.id === encodePaintingId
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-surface-900">
            Dead Drop
          </h1>
          <p className="text-xs text-gray-400">
            Steganographic communication channel &mdash; {messages.length}{" "}
            signal{messages.length !== 1 && "s"} intercepted
          </p>
        </div>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Decode */}
        <div className="bg-surface-950 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400">
              Intercept
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Extract hidden payload from uploaded painting
          </p>

          <select
            value={decodePaintingId}
            onChange={(e) => {
              setDecodePaintingId(e.target.value);
              setDecodedMessage(null);
              setDecodeError("");
            }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-blue-400/50 transition-colors mb-4"
          >
            <option value="">Select target painting...</option>
            {paintings.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
                {p.has_steg_message && p.steg_decoded
                  ? " [DECODED]"
                  : p.has_steg_message
                  ? " [SIGNAL]"
                  : ""}
              </option>
            ))}
          </select>

          {selectedDecodePainting && (
            <div className="mb-4 rounded-lg overflow-hidden border border-white/5">
              <img
                src={imageUrl(
                  selectedDecodePainting.thumbnail_path ||
                    selectedDecodePainting.image_path
                )}
                alt={selectedDecodePainting.title}
                className="w-full max-h-40 object-contain bg-black/20"
              />
            </div>
          )}

          <button
            onClick={handleDecode}
            disabled={!decodePaintingId || decoding}
            className="w-full bg-blue-500 text-white py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-blue-600 disabled:opacity-30 transition-all"
          >
            {decoding ? "Decoding..." : "Extract Signal"}
          </button>

          {decodeError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono">
              ERR: {decodeError}
            </div>
          )}

          {decodedMessage !== null && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <p className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-2">
                Decoded Payload
              </p>
              <p className="text-green-300 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words">
                {decodedMessage}
              </p>
            </div>
          )}
        </div>

        {/* Encode */}
        <div className="bg-surface-950 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400">
              Embed
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Hide reply message inside a listed painting
          </p>

          <select
            value={encodePaintingId}
            onChange={(e) => {
              setEncodePaintingId(e.target.value);
              setEncodeSuccess(false);
              setEncodeError("");
            }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-purple-400/50 transition-colors mb-4"
          >
            <option value="">Select carrier painting...</option>
            {paintings.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {selectedEncodePainting && (
            <div className="mb-4 rounded-lg overflow-hidden border border-white/5">
              <img
                src={imageUrl(
                  selectedEncodePainting.thumbnail_path ||
                    selectedEncodePainting.image_path
                )}
                alt={selectedEncodePainting.title}
                className="w-full max-h-40 object-contain bg-black/20"
              />
            </div>
          )}

          <textarea
            value={encodeMessage}
            onChange={(e) => setEncodeMessage(e.target.value)}
            placeholder="Enter covert message..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300 font-mono outline-none focus:border-purple-400/50 placeholder:text-gray-600 transition-colors mb-4"
          />

          <button
            onClick={handleEncode}
            disabled={!encodePaintingId || !encodeMessage || encoding}
            className="w-full bg-purple-500 text-white py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-purple-600 disabled:opacity-30 transition-all"
          >
            {encoding ? "Embedding..." : "Embed Signal"}
          </button>

          {encodeError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono">
              ERR: {encodeError}
            </div>
          )}

          {encodeSuccess && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-lg text-xs font-mono">
              Signal embedded into carrier image. Listing updated.
            </div>
          )}
        </div>
      </div>

      {/* Message Log */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Signal Log
          </h2>
        </div>
        {messages.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No signals recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-3">Direction</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Content</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {messages.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          m.direction === "incoming"
                            ? "bg-blue-50 text-blue-600"
                            : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            m.direction === "incoming"
                              ? "bg-blue-500"
                              : "bg-purple-500"
                          }`}
                        />
                        {m.direction === "incoming" ? "RX" : "TX"}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-500">
                      {m.painting_id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-3 max-w-xs truncate text-surface-700">
                      {m.message_text}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 tabular-nums">
                      {new Date(m.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
