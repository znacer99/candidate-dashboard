export default function handler(req, res) {
  res.status(200).json({ status: "ok", message: "Candidate sync active", timestamp: new Date().toISOString() });
}
