"use client";

import { useEffect, useState } from "react";
import { api, imageUrl } from "@/lib/api";
import { Painting, StegMessage, DecodeResponse, EncodeResponse } from "@/lib/types";

export default function DeadDropPage() {
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [messages, setMessages] = useState<StegMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Decode state
  const [decodePaintingId, setDecodePaintingId] = useState("");
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState("");

  // Encode state
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
      // Update painting in list
      setPaintings((prev) =>
        prev.map((p) =>
          p.id === decodePaintingId
            ? { ...p, has_steg_message: true, steg_decoded: true }
            : p
        )
      );
    } catch (err) {
      setDecodeError(
        err instanceof Error ? err.message : "Decode failed"
      );
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
          p.id === encodePaintingId
            ? { ...p, has_steg_message: true }
            : p
        )
      );
    } catch (err) {
      setEncodeError(
        err instanceof Error ? err.message : "Encode failed"
      );
    } finally {
      setEncoding(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading...</div>;

  const selectedDecodePainting = paintings.find(
    (p) => p.id === decodePaintingId
  );
  const selectedEncodePainting = paintings.find(
    (p) => p.id === encodePaintingId
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dead Drop</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Decode Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Decode Hidden Message</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select a painting to extract any hidden steganographic message.
          </p>

          <select
            value={decodePaintingId}
            onChange={(e) => {
              setDecodePaintingId(e.target.value);
              setDecodedMessage(null);
              setDecodeError("");
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Select a painting...</option>
            {paintings.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.has_steg_message && p.steg_decoded ? "(decoded)" : p.has_steg_message ? "(has message)" : ""}
              </option>
            ))}
          </select>

          {selectedDecodePainting && (
            <div className="mb-4">
              <img
                src={imageUrl(
                  selectedDecodePainting.thumbnail_path ||
                    selectedDecodePainting.image_path
                )}
                alt={selectedDecodePainting.title}
                className="w-full max-h-48 object-contain rounded"
              />
            </div>
          )}

          <button
            onClick={handleDecode}
            disabled={!decodePaintingId || decoding}
            className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {decoding ? "Decoding..." : "Decode"}
          </button>

          {decodeError && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded text-sm">
              {decodeError}
            </div>
          )}

          {decodedMessage !== null && (
            <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded">
              <p className="text-sm font-medium text-green-800 mb-1">
                Decoded Message:
              </p>
              <p className="text-green-900 font-mono text-sm whitespace-pre-wrap">
                {decodedMessage}
              </p>
            </div>
          )}
        </div>

        {/* Encode Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Encode Reply Message
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Select a painting and embed a hidden message into its image.
          </p>

          <select
            value={encodePaintingId}
            onChange={(e) => {
              setEncodePaintingId(e.target.value);
              setEncodeSuccess(false);
              setEncodeError("");
            }}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="">Select a painting...</option>
            {paintings.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {selectedEncodePainting && (
            <div className="mb-4">
              <img
                src={imageUrl(
                  selectedEncodePainting.thumbnail_path ||
                    selectedEncodePainting.image_path
                )}
                alt={selectedEncodePainting.title}
                className="w-full max-h-48 object-contain rounded"
              />
            </div>
          )}

          <textarea
            value={encodeMessage}
            onChange={(e) => setEncodeMessage(e.target.value)}
            placeholder="Enter your secret message..."
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-gray-900"
          />

          <button
            onClick={handleEncode}
            disabled={!encodePaintingId || !encodeMessage || encoding}
            className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {encoding ? "Encoding..." : "Encode Message"}
          </button>

          {encodeError && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded text-sm">
              {encodeError}
            </div>
          )}

          {encodeSuccess && (
            <div className="mt-4 bg-green-50 text-green-700 p-3 rounded text-sm">
              Message encoded successfully into painting image.
            </div>
          )}
        </div>
      </div>

      {/* Message History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Message History</h2>
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Direction</th>
                <th className="text-left px-4 py-3 font-medium">Painting</th>
                <th className="text-left px-4 py-3 font-medium">Message</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {messages.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        m.direction === "incoming"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {m.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {m.painting_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    {m.message_text}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
